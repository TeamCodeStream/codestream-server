// handles matching third-party identity information with an existing CodeStream user and/or team
// if no match is found, optionally create the user and team

'use strict';

const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');
const UserCreator = require('../users/user_creator');
const Indexes = require('../users/indexes');
const TeamIndexes = require(process.env.CS_API_TOP + '/modules/teams/indexes');
const TeamCreator = require(process.env.CS_API_TOP + '/modules/teams/team_creator');
const AddTeamMember = require(process.env.CS_API_TOP + '/modules/teams/add_team_member');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const ConfirmHelper = require('../users/confirm_helper');

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

		// must have these attributes from the provider or we can't proceed
		['email', 'teamId', 'teamName', 'userId'].forEach(attribute => {
			if (!this.providerInfo[attribute]) {
				throw this.errorHandler.error('parameterRequired', { info: attribute });
			}
		});

		// for usernames, if we couldn't get one, take the first part of the email
		if (!this.providerInfo.username) {
			this.providerInfo.username = EmailUtilities.parseEmail(this.providerInfo.email).name;
		}
		this.providerInfo.username = this.providerInfo.username.replace(/ /g, '_');

		await this.findTeam();
		await this.findUser();
		await this.createUserAsNeeded();
		await this.createTeamAsNeeded();
		await this.addUserToTeamAsNeeded();
		await this.setUserProviderInfo();
		await this.confirmUserAsNeeded();
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
			if (this.expectedTeamId) {
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
		if (!user) { return; }
		this.request.log('Matched user ' + user.id + ' by provider identity');
		
		// get any existing provider info associated with this provider
		const userProviderInfo = user.get('providerInfo') || {};
		let providerTeamInfo;
		Object.keys(userProviderInfo).find(teamId => {
			if (teamId === this.provider) {
				providerTeamInfo = userProviderInfo[teamId];
				return true;
			}
			else if (userProviderInfo[teamId][this.provider]) {
				providerTeamInfo = userProviderInfo[teamId][this.provider];
				return true;
			}
		});

		// if we found a user, but the user is on a different team for this provider, throw an error,
		// we can't allow the user to be logged in for this provider in two different ways (yet)
		if (
			providerTeamInfo &&
			providerTeamInfo.teamId !== this.providerInfo.teamId
		) {
			throw this.errorHandler.error('duplicateProviderAuth');
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

		if (user && !this.okToFindExistingUserByEmail) {
			// under the sharing model...
			// if we found a user not yet associated with an identity for this provider,
			// then we're going to make them sign-in using their CodeStream credentials...
			// but exception for unregistered users, in which case we return the same error
			// as we would if they didn't exist at all
			this.request.log('Matched user ' + user.id + ' by email');
			if (user.get('isRegistered')) {
				throw this.errorHandler.error('providerAuthNotAllowed');
			}
			else {
				this.request.log('User is not registered, treat this as if there is no match to the identity');
				throw this.errorHandler.error('noIdentityMatch');
			}
		}

		// if we found a user, but we see that the user already has credentials for this provider,
		// throw an error, we can't allow the user to be logged in for this provider in two different ways (yet)
		if (user) {
			const userProviderInfo = user.get('providerInfo') || {};
			if (Object.keys(userProviderInfo).find(teamId => {
				return (
					teamId === this.provider ||
					userProviderInfo[teamId][this.provider]
				);
			})) {
				throw this.errorHandler.error('duplicateProviderAuth');
			}
			this.request.log('Matched user ' + user.id + ' by email');
		}

		return user;
	}

	// create a provider-registered user if one was not found, based on the passed information
	async createUserAsNeeded () {
		if (this.user) {
			return;
		}
		else if (!this.okToCreateUser) {
			return;
		}
		else if (!this.team && !this.okToCreateTeam) {
			// we don't allow a new user to be created with a new team in the "sharing model"
			this.request.log('No match to user, in sharing model they must sign up first');
			throw this.errorHandler.error('noIdentityMatch');
		}

		this.request.log('No match to user, will create...');
		this.userCreator = new UserCreator({
			request: this.request,
			// allow unregistered users to listen to their own me-channel, strictly for testing purposes
			subscriptionCheat: this._subscriptionCheat === this.api.config.secrets.subscriptionCheat
		});

		const userData = {
			_pubnubUuid: this._pubnubUuid,
			providerIdentities: [`${this.provider}::${this.providerInfo.userId}`]
		};
		['email', 'username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn'].forEach(attribute => {
			if (this.providerInfo[attribute]) {
				userData[attribute] = this.providerInfo[attribute];
			}
		});
		if (this.team) {
			userData.providerInfo = {
				[this.provider]: {
					[this.team.id]: {
						userId: this.providerInfo.userId,
						teamId: this.providerInfo.teamId,
						accessToken: this.providerInfo.accessToken
					}
				}
			};
		}
		this.user = this.createdUser = await this.userCreator.createUser(userData);
	}
	
	// create a team to associate with this identity, if one was not found
	async createTeamAsNeeded () {
		if (this.team) {
			return;
		}
		if (!this.okToCreateTeam) {
			if (this.user.get('mustSetPassword')) {
				this.request.log(`Match found to ${this.provider} user, but user must set a password, allowing no match to team`);
				return;
			}
			// we don't allow a new user to be created with a new team in the "sharing model"
			this.request.log('No match to user, in sharing model they must sign up first');
			throw this.errorHandler.error('noIdentityMatch');
		}
		
		this.request.log('No match to team, will create...');
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

	// one way or the other the user will be added to a team ... if there was no team identified
	// with the provider credentials, create one, and if there was one, add the user to it
	async addUserToTeamAsNeeded () {
		if (!this.team) { return; }
		if (this.team.get('memberIds').includes(this.user.id)) {
			return;
		}
		await new AddTeamMember({
			request: this.request,
			addUser: this.user,
			team: this.team
		}).addTeamMember();
		this.userWasAddedToTeam = true;
	}

	// might need to update the user object, either because we had to create it before we had to create or team,
	// or because we found an existing user object, and its identity information from the provider has changed
	async setUserProviderInfo () {
		if (this.user.get('mustSetPassword')) { return; }
		let mustUpdate = false;

		// if the key provider info (userId or accessToken) has changed, we need to update
		const teamlessProviderInfo = this.user.getProviderInfo(this.provider);
		const existingProviderInfo = this.user.getProviderInfo(this.provider, this.team.id);
		if (
			teamlessProviderInfo || 
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
				modifiedAt: Date.now()
			},
			$unset: {
				[`providerInfo.${this.provider}`]: true	// delete old way of storing provider info that is not associated with a team
			}
		};
		const providerInfoData = Object.assign({
			userId: this.providerInfo.userId,
			teamId: this.providerInfo.teamId,
			accessToken: this.providerInfo.accessToken
		}, this.tokenData || {});
		Object.assign(op.$set, {
			providerIdentities: identities,
			[`providerInfo.${this.team.id}.${this.provider}`]: providerInfoData
		});

		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// if we found an existing unregistered user, signing in is like confirmation,
	// so update the user to indicate they are confirmed
	async confirmUserAsNeeded () {
		if (this.user.get('isRegistered')) {
			return;
		}

		const userData = {};
		['email', 'username', 'fullName', 'timeZone'].forEach(attribute => {
			if (this.providerInfo[attribute]) {
				userData[attribute] = this.providerInfo[attribute];
			}
		});
		await new ConfirmHelper({
			request: this,
			user: this.user,
			dontCheckUsername: true,
			notTrueLogin: true
		}).confirm(userData);
		this.userWasConfirmed = true;
	}
}

module.exports = ProviderIdentityConnector;