// handles matching third-party identity information with an existing CodeStream user and/or team
// if no match is found, optionally create the user and team

'use strict';

const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const UserCreator = require('../users/user_creator');
const Indexes = require('../users/indexes');
const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ConfirmHelper = require('../users/confirm_helper');
const GitLensReferralLookup = require('../users/gitlens_referral_lookup');

class ProviderIdentityConnector {

	constructor (options) {
		Object.assign(this, options);
		['errorHandler', 'data', 'transforms', 'api'].forEach(prop => {
			this[prop] = this.request[prop];
		});

		// just to make sure
		if (options.signupToken || options.teamId) {
			throw this.errorHandler.error('deprecated', { reason: 'provider identity connection with signup token or team ID is no longer supported '});
		}

		// can assume this is set when we have fully moved to ONE_USER_PER_ORG
		this.oneUserPerOrg = (
			this.request.api.modules.modulesByName.users.oneUserPerOrg ||
			this.request.request.headers['x-cs-one-user-per-org']
		);
	}

	// attempt to match the given third-party provider identification information to a
	// CodeStream user, create the user as needed and requested
	async connectIdentity (providerInfo) {
		this.providerInfo = providerInfo;

		// must have these attributes from the provider or we can't proceed
		['email', 'userId'].forEach(attribute => {
			if (!this.providerInfo[attribute]) {
				throw this.errorHandler.error('parameterRequired', { info: attribute });
			}
		});

		// for usernames, if we couldn't get one, take the first part of the email
		if (!this.providerInfo.username) {
			this.providerInfo.username = EmailUtilities.parseEmail(this.providerInfo.email).name;
		}
		this.providerInfo.username = this.providerInfo.username.replace(/ /g, '_');

		await this.findUser();
		await this.createUserAsNeeded();
		await this.setUserProviderInfo();
		await this.confirmUserAsNeeded();
	}
	
	// find the user associated with the passed credentials, first by matching against the 
	// provider identity extracted from the passed provider info, and then by matching against email
	async findUser () {
		const users = await this.data.users.getByQuery(
			{ searchableEmail: this.providerInfo.email.toLowerCase() },
			{ hint: Indexes.bySearchableEmail }
		);

		// under one-user-per-org, match a registered user matching the team provided,
		// or the first registered user, or a teamless unregistered user
		if (this.oneUserPerOrg) {
			let firstRegisteredUser, teamlessUnregisteredUser;
			const matchingUser = users.find(user => {
				if (user.get('deactivated')) { return; }
				const teamIds = user.get('teamIds') || [];
				if (this.teamId && teamIds.includes(this.teamId)) {
					return user;
				} else if (!firstRegisteredUser && user.get('isRegistered')) {
					firstRegisteredUser = user;
				} else if (!teamlessUnregisteredUser && !user.get('isRegistered') && teamIds.length === 0) {
					teamlessUnregisteredUser = user;
				}
			});
			this.user = matchingUser || firstRegisteredUser || teamlessUnregisteredUser;
		} else {
			this.user = users[0];
		}

		if (this.user) {
			this.request.log(`Matched user ${this.user.id} by email`);
			if (this.user.get('isRegistered')) { // can remove this check when we have fully moved to ONE_USER_PER_ORG
				return;
			}
		}
		if (!this.okToCreateUser) {
			if (this.user) {
				this.request.log('Unregistered user must create an account first');
			}
			throw this.errorHandler.error('noIdentityMatch');
		}
	}
	
	// create a provider-registered user if one was not found, based on the passed information
	async createUserAsNeeded () {
		if (this.user) {
			return;
		}
		this.request.log('No match to user, will create...');
		this.userCreator = new UserCreator({
			request: this.request
		});

		const userData = {
			_pubnubUuid: this._pubnubUuid,
			providerIdentities: [`${this.provider}::${this.providerInfo.userId}`]
		};
		['email', 'username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn'].forEach(attribute => {
			if (this.providerInfo[attribute]) {
				userData[attribute] = this.providerInfo[attribute] || '';
			}
		});
		if (this.providerInfo.avatarUrl) {
			userData.avatar = {
				image: this.providerInfo.avatarUrl
			};
		}

		// if this user came from GitLens, update source attribute
		if (await GitLensReferralLookup(this.request.api.data, userData.email, this.machineId)) {
			userData.source = 'GitLens';
		}

		this.user = this.createdUser = await this.userCreator.createUser(userData);
	}

	// might need to update the user object, either because we had to create it before we had to create or team,
	// or because we found an existing user object, and its identity information from the provider has changed
	async setUserProviderInfo () {
		let mustUpdate = false;

		// if the key provider info (userId or accessToken) has changed, we need to update
		const teamlessProviderInfo = this.user.getProviderInfo(this.provider);
		if (
			!teamlessProviderInfo ||
			teamlessProviderInfo.userId !== this.providerInfo.userId ||
			teamlessProviderInfo.accessToken !== this.providerInfo.accessToken
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
			}
		};
		const providerInfoData = Object.assign({
			userId: this.providerInfo.userId,
			accessToken: this.providerInfo.accessToken,
			hostUrl: this.providerInfo.hostUrl
		}, this.tokenData || {});
		Object.assign(op.$set, {
			providerIdentities: identities,
			[`providerInfo.${this.provider}`]: providerInfoData
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
			request: this.request,
			user: this.user,
			dontCheckUsername: true,
			notTrueLogin: true
		}).confirm(userData);
		this.userWasConfirmed = true;
	}
}

module.exports = ProviderIdentityConnector;