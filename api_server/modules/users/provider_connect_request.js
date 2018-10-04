// handle the "POST /no-auth/provider-connect" request to handle user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const UserCreator = require('./user_creator');
const UserPublisher = require('./user_publisher');
const Errors = require('./errors');
const Indexes = require('./indexes');
const TeamIndexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const ConfirmHelper = require('./confirm_helper');
const LoginHelper = require('./login_helper');
const TeamCreator = require(process.env.CS_API_TOP + '/modules/teams/team_creator');
const AddTeamMembers = require(process.env.CS_API_TOP + '/modules/teams/add_team_members');

class ProviderConnectRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no authorization necessary, authorization is handled by the processing logic
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.authorizeByProvider();	// authorize the credentials passed for the particular provider of interest
		await this.findTeam();
		await this.findUser();
		await this.createOrUpdateUser();
		await this.addUserToTeam();
		await this.confirmOrLoginUser();
		await this.saveSignupToken();		// save the signup token so we can identify this user with an IDE session
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'body',
			{
				required: {
					object: ['providerInfo']
				},
				optional: {
					string: ['signupToken', '_pubnubUuid', '_subscriptionCheat', '_mockEmail']
				}
			}
		);
	}

	// authorize the request based on the credentials passed in for the particular provider of interest
	async authorizeByProvider () {
		this.provider = this.request.params.provider.toLowerCase();
		switch (this.provider) {
		case 'slack': 
			if (this.api.services.slackAuth) {
				this.providerInfo = await this.api.services.slackAuth.authorizeProviderInfo(
					this.request.body.providerInfo,
					{ request: this, mockEmail: this.request.body._mockEmail }
				);
			}
			break;
		}
		if (!this.providerInfo) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}
		this.log(`Authorized for ${this.provider}: ${JSON.stringify(this.providerInfo, undefined, 5)}`);

		// must have these attributes from the provider
		['email', 'username'].forEach(attribute => {
			if (!this.providerInfo[attribute]) {
				throw this.errorHandler.error('parameterRequired', { info: attribute });
			}
		});
	}

	// find the team corresponding to the provider identity, if any
	async findTeam () {
		const query = {
			providerIdentities: `${this.provider}::${this.providerInfo.teamId}`,
			deactivated: false
		};
		this.team = await this.data.teams.getOneByQuery(
			query,
			{
				databaseOptions: {
					hint: TeamIndexes.byProviderIdentities
				}
			}
		);
		if (this.team) {
			this.log('Matched team ' + this.team.id);
		}
		else {
			this.log('No match for team');
		}
	}

	// find the user associated with the passed credentials, first by matching against the 
	// provider identity extracted from the passed provider info, and then by matching against email
	async findUser () {
		this.user = (
			await this.findUserByProviderId() ||
			await this.findUserByEmail()
		);
	}

	// find the user associated with the passed credentials by matching against the provider identity
	// extracted from the passed provider info
	async findUserByProviderId () {
		const query = { 
			providerIdentities: `${this.provider}::${this.providerInfo.userId}`,
			deactivated: false
		};
		const user = await this.data.users.getOneByQuery(
			query,
			{
				databaseOptions: {
					hint: Indexes.byProviderIdentities
				}
			}
		);

		// if we found a user, but the user is on a different team, throw an error,
		// we can't allow the user to be logged in for this provider in two different ways (yet)
		if (user) {
			const userProviderInfo = user.get('providerInfo') || {};
			if (
				userProviderInfo &&
				userProviderInfo[this.provider].teamId !== this.providerInfo.teamId
			) {
				throw this.errorHandler.error('duplicateProviderAuth');
			}
		}

		if (user) {
			this.log('Matched user ' + user.id + ' by provider identity');
		}
		return user;
	}

	// find a user that matches the given email
	async findUserByEmail () {
		const query = { searchableEmail: this.providerInfo.email.toLowerCase() };
		const user = await this.data.users.getOneByQuery(
			query,
			{
				databaseOptions: {
					hint: Indexes.bySearchableEmail
				}
			}
		);

		// if we found a user, but we see that the user already has credentials for this provider,
		// throw an error, we can't allow the user to be logged in for this provider in two different ways (yet)
		if (user) {
			const userProviderInfo = user.get('providerInfo') || {};
			if (userProviderInfo[this.provider]) {
				throw this.errorHandler.error('duplicateProviderAuth');
			}
			this.log('Matched user ' + user.id + ' by email');
		}

		return user;
	}

	// create the user based on the passed information, or update an existing user if we found a user
	// that matched the credentials given for the provider
	async createOrUpdateUser () {
		if (this.user) {
			await this.updateUser();
		}
		else {
			this.log('No match to user, will create...');
			await this.createUser();
		}
	}

	// we found an existing user that matched the credentials, perform any update to the user object here
	async updateUser () {
		let mustUpdate = false;

		// if the key provider info (userId or accessToken) has changed, we need to update
		const existingProviderInfo = (this.user.get('providerInfo') || {})[this.provider];
		if (
			!existingProviderInfo || 
			existingProviderInfo.userId !== this.providerInfo.userId ||
			existingProviderInfo.accessToken !== this.providerInfo.accessToken
		) {
			mustUpdate = true;
		}

		// if existing identities for this provider will be changed, we need to update
		const identity = `${this.provider}::${this.providerInfo.userId}`;
		const existingIdentities = (this.user.get('providerIdentities') || []).filter(id => {
			return id.startsWith(`${this.provider}::`);
		});
		if (existingIdentities.length !== 1 || existingIdentities[0] !== identity) {
			// identity is already stored, no other identities in use, so no need to update
			mustUpdate = true;
		}

		if (!mustUpdate) {
			return;
		}

		// preserve identities for other providers, but removing any identities for this provider, and replace
		// with the new identity passed
		const identities = (this.user.get('providerIdentities') || []).filter(id => {
			return !id.startsWith(`${this.provider}::`);
		});
		identities.push(`${this.provider}::${this.providerInfo.userId}`);
		const op = {
			$set: {
				providerIdentities: identities,
				[`providerInfo.${this.provider}`]: {
					userId: this.providerInfo.userId,
					teamId: this.providerInfo.teamId,
					accessToken: this.providerInfo.accessToken
				}
			}
		};

		await this.data.users.applyOpById(this.user.id, op);
		this.identityUpdated = true;
	}

	// this is the first login for this user to CodeStream, create a new user record with confirmed registration
	async createUser () {
		this.userCreator = new UserCreator({
			request: this,
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this.request.body._subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});

		const userData = {
			_pubnubUuid: this.request.body._pubnubUuid,
			providerInfo: {
				[this.provider]: {
					userId: this.providerInfo.userId,
					teamId: this.providerInfo.teamId,
					accessToken: this.providerInfo.accessToken
				}
			},
			providerIdentities: [`${this.provider}::${this.providerInfo.userId}`]
		};
		['email', 'username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn'].forEach(attribute => {
			if (this.providerInfo[attribute]) {
				userData[attribute] = this.providerInfo[attribute];
			}
		});
		this.user = await this.userCreator.createUser(userData);
	}

	// check if the CodeStream user (maybe newly) associated with the slack identity is registered,
	// if not, we'll confirm their registration, and if so, we'll act like this is a login
	async confirmOrLoginUser () {
		if (this.user.get('isRegistered')) {
			await this.loginUser();
		}
		else {
			await this.confirmUser();
		}
	}

	// login the (registered) user we've determined is associated with the slack credentials passed in
	async loginUser () {
		this.responseData = await new LoginHelper({
			request: this,
			user: this.user
		}).login();
	}

	// now that we have updated or created the user, if they are still not indicated as registered,
	// confirm their registration, since authorizing via third-party credentials is as good as confirming
	async confirmUser () {
		const userData = {};
		['email', 'username', 'fullName', 'timeZone'].forEach(attribute => {
			if (this.providerInfo[attribute]) {
				userData[attribute] = this.request.body[attribute];
			}
		});
		this.userWasConfirmed = true;
		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.user,
			loginType: this.loginType,
			dontCheckUsername: true
		}).confirm(userData);
	}

	// one way or the other the user will be added to a team ... if there was no team identified
	// with the provider credentials, create one, and if there was one, add the user to it
	async addUserToTeam () {
		if (!this.team) {
			await this.createTeam();
		}
		await this.addToTeam();
	}

	// create a team to associate with this identity
	async createTeam () {
		if (!this.providerInfo.teamName) {
			return;
		}
		const teamData = {
			name: this.providerInfo.teamName
		};
		this.team = this.createdTeam = await new TeamCreator({
			request: this,
			providerIdentities: [`${this.provider}::${this.providerInfo.teamId}`],
			providerInfo: {
				[this.provider]: {
					teamId: this.providerInfo.teamId
				}
			}
		}).createTeam(teamData);
	}

	// add the passed user to the team indicated, this will create the user as needed
	async addToTeam () {
		if (!this.team || this.team.get('memberIds').includes(this.user.id)) {
			return;
		}
		this.adder = new AddTeamMembers({
			request: this,
			users: [this.user],
			team: this.team
		});
		await this.adder.addTeamMembers();
		this.userWasAddedToTeam = true;
	}

	// if a signup token is provided, this allows a client IDE session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		if (!this.request.body.signupToken) {
			return;
		}
		await this.api.services.signupTokens.insert(
			this.request.body.signupToken,
			this.user.id,
			{ 
				requestId: this.request.id
			}
		);
	}

	// after a response is returned....
	async postProcess () {
		// new users get published to the team channel
		if (this.userWasConfirmed || this.userWasAddedToTeam) {
			await this.publishUserToTeams();
		}
		if (this.userWasAddedToTeam || this.identityUpdated) {
			await this.publishUserToSelf();
		}
	}

	// publish the new user to the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject(),
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams();
	}

	// publish updated user to themselves, because their identity token has changed
	async publishUserToSelf () {
		const message = {
			user: this.user.getSanitizedObjectForMe(),
			requestId: this.request.id
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.messager.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish user update to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-connect',
			summary: 'Connects a user from a third-party provider to CodeStream',
			access: 'No authorization needed, authorization is handled within the request logic',
			description: 'Once third-party authorization is complete, call this request to register the user with CodeStream; the user will be assumed to be confirmed after a basic check of the provider credentials with the provider in question',
			input: {
				summary: 'Specify attributes in the body',
				looksLike: {
					'providerInfo*': '<Provider info with credentials and other info gleaned from the third-party auth process>',
					'signupToken': '<Client-generated signup token, passed to signup on the web, to associate an IDE session with the new user>'
				}
			},
			returns: {
				summary: 'Returns a user object',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			publishes: {
				summary: 'If the user was invited and being put on a new team, or if the user was already on a teams and was confirmed with this request, an updated user object will be published to the team channel for each team the user is on.',
				looksLike: {
					user: '<@@#user object#user@@>'
				}
			},
			errors: [
				'parameterRequired',
				'usernameNotUnique',
				'exists',
				'validation',
				'unknownProvider',
				'invalidProviderCredentials',
				'duplicateProviderAuth'
			]
		};
	}
}

module.exports = ProviderConnectRequest;
