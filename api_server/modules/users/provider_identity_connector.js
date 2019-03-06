// handles matching third-party identity information with an existing CodeStream user and/or team
// if no match is found, optionally create the user and team

'use strict';

const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const UserCreator = require('./user_creator');
const Indexes = require('./indexes');
const TeamIndexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const TeamCreator = require(process.env.CS_API_TOP + '/modules/teams/team_creator');
const AddTeamMember = require(process.env.CS_API_TOP + '/modules/teams/add_team_member');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderIdentityConnector {

	constructor (options) {
		Object.assign(this, options);
		['errorHandler', 'data', 'transforms', 'api'].forEach(prop => {
			this[prop] = this.request[prop];
		});
	}

	// attempt to match the given third-party provider identification information to a
	// CodeStream user, create the user as needed and requested
	async connectIdentity (providerInfo) {
		this.providerInfo = providerInfo;

		// must have an email or we can't proceed
		if (!this.providerInfo.email) {
			throw this.errorHandler.error('parameterRequired', { info: 'email' });
		}
		if (!this.providerInfo.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		if (!this.providerInfo.userId) {
			throw this.errorHandler.error('parameterRequired', { info: 'userId' });
		}

		// for usernames, if we couldn't get one, take the first part of the email
		if (!this.providerInfo.username) {
			this.providerInfo.username = EmailUtilities.parseEmail(this.providerInfo.email).name;
		}
		this.providerInfo.username = this.providerInfo.username.replace(/ /g, '_');

		await this.findTeam();
		await this.findUser();
		await this.createOrUpdateUser();
		await this.addUserToTeam();
	}
	
	// find the team corresponding to the provider identity, if any
	async findTeam () {
		const query = {
			providerIdentities: `${this.provider}::${this.providerInfo.teamId}`,
			deactivated: false
		};
		this.team = await this.data.teams.getOneByQuery(
			query,
			{ hint: TeamIndexes.byProviderIdentities }
		);
		if (this.team) {
			this.request.log('Matched team ' + this.team.id);
			if (this.expectedTeamId && this.expectedTeamId !== this.team.id) {
				throw this.errorHandler.error('inviteTeamMismatch', { reason: 'incorrect match to third-party team' });
			}
		}
		else {
			this.request.log('No match for team');
			if (this.expectedTeamId || this.mustMatchTeam) {
				throw this.errorHandler.error('inviteTeamMismatch', { reason: 'no match to third-party team' });
			}
		}
	}

	// find the user associated with the passed credentials, first by matching against the 
	// provider identity extracted from the passed provider info, and then by matching against email
	async findUser () {
		this.user = (
			await this.findUserByProviderId() ||
			await this.findUserByEmail()
		);
		if (this.mustMatchUser && !this.user) {
			throw this.errorHandler.error('noIdentityMatch');
		}
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
			{ hint: Indexes.byProviderIdentities }
		);

		// if we found a user, but the user is on a different team, throw an error,
		// we can't allow the user to be logged in for this provider in two different ways (yet)
		if (user) {
			const userProviderInfo = user.get('providerInfo') || {};
			if (
				userProviderInfo &&
				userProviderInfo[this.provider] && 
				userProviderInfo[this.provider].teamId !== this.providerInfo.teamId
			) {
				throw this.errorHandler.error('duplicateProviderAuth');
			}
		}

		if (user) {
			this.request.log('Matched user ' + user.id + ' by provider identity');
		}
		return user;
	}

	// find a user that matches the given email
	async findUserByEmail () {
		const query = { searchableEmail: this.providerInfo.email.toLowerCase() };
		const user = await this.data.users.getOneByQuery(
			query,
			{ hint: Indexes.bySearchableEmail }
		);

		// if we found a user, but we see that the user already has credentials for this provider,
		// throw an error, we can't allow the user to be logged in for this provider in two different ways (yet)
		if (user) {
			const userProviderInfo = user.get('providerInfo') || {};
			if (userProviderInfo[this.provider]) {
				throw this.errorHandler.error('duplicateProviderAuth');
			}
			this.request.log('Matched user ' + user.id + ' by email');
		}

		return user;
	}

	// create the user based on the passed information, or update an existing user if we found a user
	// that matched the credentials given for the provider
	async createOrUpdateUser () {
		if (this.user) {
			await this.updateUser();
		}
		else if (this.okToCreateUser) {
			this.request.log('No match to user, will create...');
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
				},
				modifiedAt: Date.now()
			}
		};

		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
		this.identityUpdated = true;
	}

	// this is the first login for this user to CodeStream, create a new user record with confirmed registration
	async createUser () {
		this.userCreator = new UserCreator({
			request: this.request,
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this._subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});

		const userData = {
			_pubnubUuid: this._pubnubUuid,
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
		this.user = this.createdUser = await this.userCreator.createUser(userData);
	}

	// one way or the other the user will be added to a team ... if there was no team identified
	// with the provider credentials, create one, and if there was one, add the user to it
	async addUserToTeam () {
		if (!this.okToAddUserToTeam) {
			return;
		}
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
		this.request.user = this.user;
		this.team = this.createdTeam = await new TeamCreator({
			request: this.request,
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
		await new AddTeamMember({
			request: this.request,
			addUser: this.user,
			team: this.team
		}).addTeamMember();
		this.userWasAddedToTeam = true;
	}
}

module.exports = ProviderIdentityConnector;