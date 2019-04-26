// handle the "POST /no-auth/provider-connect" request to handle user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const UserPublisher = require('./user_publisher');
const Errors = require('./errors');
const ConfirmHelper = require('./confirm_helper');
const LoginHelper = require('./login_helper');
const ProviderIdentityConnector = require('./provider_identity_connector');

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
		this.log(`Request body: ${JSON.stringify(this.request.body, undefined, 5)}`);
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.authorizeByProvider();	// authorize the credentials passed for the particular provider of interest
		await this.connectIdentity();		// connect the provider identity to a CodeStream identity
		await this.confirmOrLoginUser();	// confirm or login the user, depending on prior status
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
					string: ['signupToken', 'teamId', '_pubnubUuid', '_subscriptionCheat', '_mockEmail']
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
	}

	// connect the provider's identity to a CodeStream user, or create a CodeStream user as needed
	async connectIdentity () {
		const options = {
			request: this,
			provider: this.provider,
			okToCreateUser: true,
			okToAddUserToTeam: true,
			_pubnubUuid: this.request.body._pubnubUuid,
			_subscriptionCheat: this.request.body._subscriptionCheat
		};
		if (this.request.body.teamId) {
			options.expectedTeamId = this.request.body.teamId.toLowerCase();
		}
		this.connector = new ProviderIdentityConnector(options);
		await this.connector.connectIdentity(this.providerInfo);
	}

	// check if the CodeStream user (maybe newly) associated with the slack identity is registered,
	// if not, we'll confirm their registration, and if so, we'll act like this is a login
	async confirmOrLoginUser () {
		this.user = this.connector.user;
		if (this.user.get('isRegistered')) {
			await this.loginUser();
		}
		else {
			await this.confirmUser();
		}

		// set signup status
		if (this.connector.createdTeam) {
			this.responseData.signupStatus = 'teamCreated';
		}
		else if (this.connector.createdUser) {
			this.responseData.signupStatus = 'userCreated';
		}
		else {
			this.responseData.signupStatus = 'signedIn';
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
		this.responseData = await new ConfirmHelper({
			request: this,
			user: this.user,
			loginType: this.loginType,
			dontCheckUsername: true
		}).confirm(userData);
		this.userWasConfirmed = true;
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
		if (this.userWasConfirmed || this.connector.userWasAddedToTeam) {
			await this.publishUserToTeams();
		}
		if (this.connector.userWasAddedToTeam || this.connector.identityUpdated) {
			await this.publishUserToSelf();
		}
	}

	// publish the new user to the team channel
	async publishUserToTeams () {
		let data;
		if (this.connector.userWasAddedToTeam) {
			data = {
				user: this.user.getSanitizedObject({ request: this })
			};
		}
		else {
			data = {
				user: Object.assign(
					{
						_id: this.user.id,	// DEPRECATE ME
						id: this.user.id
					}, 
					this.transforms.userUpdate
				)
			};
		}
		await new UserPublisher({
			user: this.user,
			data,
			request: this,
			messager: this.api.services.messager
		}).publishUserToTeams();
	}

	// publish updated user to themselves, because their identity token has changed
	async publishUserToSelf () {
		const data = {
			user: Object.assign(
				{
					_id: this.user.id,	// DEPRECATE ME
					id: this.user.id
				},
				this.transforms.userUpdate
			),
			requestId: this.request.id
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.messager.publish(
				data,
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
				'duplicateProviderAuth',
				'inviteTeamMismatch'
			]
		};
	}
}

module.exports = ProviderConnectRequest;
