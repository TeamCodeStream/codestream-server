// handles matching third-party identity information with an existing CodeStream user and/or team
// if no match is found, optionally create the user and team

'use strict';

const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const UserCreator = require('../users/user_creator');
const UserIndexes = require('../users/indexes');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ConfirmHelper = require('../users/confirm_helper');
const GitLensReferralLookup = require('../users/gitlens_referral_lookup');
const CompanyIndexes = require('../companies/indexes');
const CompanyCreator = require('../companies/company_creator');
const TeamCreator = require('../teams/team_creator');
const AddTeamMembers = require('../teams/add_team_members');
const JoinCompanyHelper = require('../users/join_company_helper');

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
	}

	// attempt to match the given third-party provider identification information to a
	// CodeStream user, create the user as needed and requested
	async connectIdentity (providerInfo) {
		this.providerInfo = providerInfo;
		if (!providerInfo.nrUserId) {
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
			this.providerInfo.username = this.providerInfo.username.replace(/[^A-Za-z0-9-._]/g, '_');
		} else {
			this.providerInfo.userId = this.providerInfo.nrUserId;
		}

		await this.findUser();
		await this.createUserAsNeeded();
		await this.createOrJoinCompany();
		await this.setUserProviderInfo();
		await this.confirmUserAsNeeded();
	}
	
	// find the user associated with the passed credentials, first by matching against the 
	// provider identity extracted from the passed provider info, and then by matching against email
	async findUser () {
		// for normal OAuth, match on email, but for New Relic IDP, match on NR User ID
		const { query, hint } = this.providerInfo.nrUserId ?
			{
				query: { nrUserId: parseInt(this.providerInfo.nrUserId, 10) },
				hint: UserIndexes.byNRUserId
			} :
			{
				query: { searchableEmail: this.providerInfo.email.toLowerCase() },
				hint: UserIndexes.bySearchableEmail
			};
		const users = await this.data.users.getByQuery(query, { hint });

		// if user is explicitly joining a company, need to get the team to find the invited user record
		if (this.joinCompanyId) {
			this.request.log(`NEWRELIC IDP TRACK: Social signup user is now joining existing company ${this.joinCompanyId}...`);
			this.company = await this.data.companies.getById(this.joinCompanyId);
			if (this.company && !this.company.get('deactivated')) {
				this.teamId = this.company.get('everyoneTeamId');
			}
		}

		// under one-user-per-org, match a registered user matching the team provided,
		// or the first registered user, or a teamless unregistered user
		let firstRegisteredUser, teamlessUnregisteredUser;
		const matchingUser = users.find(user => {
			if (user.get('deactivated')) { return; }
			const teamIds = user.get('teamIds') || [];
			if (this.teamId && teamIds.includes(this.teamId) && !user.get('isRegistered')) {
				return user;
			} else if (!firstRegisteredUser && user.get('isRegistered')) {
				firstRegisteredUser = user;
			} else if (!teamlessUnregisteredUser && !user.get('isRegistered') && teamIds.length === 0) {
				teamlessUnregisteredUser = user;
			}
		});

		this.user = matchingUser || firstRegisteredUser || teamlessUnregisteredUser;
		if (this.user) {
			let by = this.providerInfo.nrUserId ? 'nrUserId' : 'email';
			if (this.teamId) {
				by += ` and teamId ${this.teamId}`;
			}
			this.request.log(`Matched user ${this.user.id} by ${by}`);
			if (this.user.get('isRegistered')) {
				if (this.okToCreateUser && this.wasNRCodeHostSignOn) {
					// if there is already a matching registered user, and user signed on using code host (social),
					// don't allow a sign-up to proceed
					throw this.errorHandler.error('alreadyRegistered');
				}
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
		this.request.log('NEWRELIC IDP TRACK: Provider identity connector creating a new user...');
		this.request.log('No match to user, will create...');
		this.userCreator = new UserCreator({
			request: this.request
		});

		const userData = {
			_pubnubUuid: this._pubnubUuid,
			providerIdentities: [`${this.provider}::${this.providerInfo.userId}`]
		};
		['email', 'username', 'fullName', 'timeZone', 'phoneNumber', 'iWorkOn', 'nrUserId', 'nrUserInfo'].forEach(attribute => {
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

	// add the user to a team (company/org) as needed
	// this only applies to New Relic login (which ultimately will be all we have)
	async createOrJoinCompany () {
		// if explicitly joining a company, get the JoinCompanyHelper to help us
		if (this.joinCompanyId) {
			this.request.log(`User is explicitly joining company ${this.joinCompanyId}...`);
			const helper = new JoinCompanyHelper({
				request: this.request,
				user: this.user,
				companyId: this.joinCompanyId,
				confirmHelperClass: ConfirmHelper, // this avoids a circular require
				dontSaveProviderInfo: true
			});
			await helper.authorize();
			await helper.process();
			this.team = helper.team;
			return;
		}

		// otherwise, outside of New Relic context, users are not automatically put in an org
		if (!this.providerInfo.nrUserId || !this.providerInfo.nrOrgId) {
			return;
		}

		// look up the org
		this.company = this.company || await this.request.data.companies.getOneByQuery(
			{ 
				linkedNROrgId: this.providerInfo.nrOrgId,
				deactivated:false
			}, {
				hint: CompanyIndexes.byLinkedNROrgId
			}
		);
		if (!this.company || this.company.get('deactivated')) {
			this.request.log(`New Relic user ${this.providerInfo.nrUserId} has no match for company ${this.providerInfo.nrOrgId}, will create...`);
			await this.createCompanyForNROrg();
		} else if (this.company.id === (this.user.get('companyIds') || [])[0]) {
			this.request.log(`New Relic user's org ID of ${this.providerInfo.nrOrgId} matches company ${this.company.id}, and user is already in that company, proceeding with login...`);
			return;
		} else {
			this.request.log(`New Relic user's org ID of ${this.providerInfo.nrOrgId} matches company ${this.company.id}, joining user to that org...`);
		}
		this.team = await this.request.data.teams.getById(this.company.get('everyoneTeamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'everyone team' }); // shouldn't happen
		}

		this.request.log('NEWRELIC IDP TRACK: Joining user to existing CS company for NR org...');
		
		// add the current user to the everyone team for the company
		await new AddTeamMembers({
			request: this.request,
			addUsers: [this.user],
			team: this.team
		}).addTeamMembers();
	}

	// create a CodeStream company corresponding to the NR org this user is coming from
	async createCompanyForNROrg () {
		this.request.log('NEWRELIC IDP TRACK: Creating a CS company for NR org...');
		this.request.user = this.user;
		this.request.teamCreatorClass = TeamCreator; // HACK - this avoids a circular require
		this.company = await new CompanyCreator({
			request: this.request,
			user: this.user,
			skipIDPSignup: true,
			nrOrgInfoOK: true
		}).createCompany({
			name: this.providerInfo.companyName,
			linkedNROrgId: this.providerInfo.nrOrgId,
			codestreamOnly: false,
			orgOrigination: 'NR'
		});
		this.createdTeam = this.transforms.createdTeam;
	}

	// might need to update the user object, either because we had to create it before we had to create or team,
	// or because we found an existing user object, and its identity information from the provider has changed
	async setUserProviderInfo () {
		let mustUpdate = false;
		const op = { 
			$set: {
				modifiedAt: Date.now()
			}
		};

		// if the key provider info (userId or accessToken) has changed, we need to update
		const token = (this.tokenData && this.tokenData.accessToken) || this.providerInfo.accessToken;
		if (token && this.providerInfo.userId) {

			// if existing identities for this provider will be changed, we need to update
			const providerName = this.provider === 'newrelicidp' ? 'newrelic' : this.provider;
			const identity = `${providerName}::${this.providerInfo.userId}`;
			const existingIdentities = (this.user.get('providerIdentities') || []).filter(id => {
				return id.startsWith(`${providerName}::`);
			});
			let identities = [];
			if (existingIdentities.length !== 1 || existingIdentities[0] !== identity) {
				identities = (this.user.get('providerIdentities') || []).filter(id => {
					return !id.startsWith(`${providerName}::`);
				});
				identities.push(`${providerName}::${this.providerInfo.userId}`);
				op.$set.providerIdentities = identities;
				mustUpdate = true;
			}

			// in the case of New Relic IDP, we wait until the user joins an org
			if (this.provider !== 'newrelicidp') {
				const teamlessProviderInfo = this.user.getProviderInfo(this.provider);
				if (
					!teamlessProviderInfo ||
					teamlessProviderInfo.userId !== this.providerInfo.userId ||
					teamlessProviderInfo.accessToken !== token
				) {
					const providerInfoData = Object.assign({
						userId: this.providerInfo.userId,
						accessToken: token,
						hostUrl: this.providerInfo.hostUrl
					}, this.tokenData || {});
					op.$set[`providerInfo.${providerName}`] = providerInfoData;
					mustUpdate = true;
				}
			}
		}

		// check if user signed up via social on New Relic, so we have their social access token now
		if (this.providerInfo.idp && this.providerInfo.idpAccessToken) {
			const idpProvider = this.providerInfo.idp.split('.')[0]; // without the .com or .org
			op.$set[`providerInfo.${idpProvider}.accessToken`] = this.providerInfo.idpAccessToken;
			if (this.providerInfo.idpRefreshToken) {
				op.$set[`providerInfo.${idpProvider}.refreshToken`] = this.providerInfo.idpRefreshToken;
			}
			if (this.providerInfo.expiresAt) {
				op.$set[`providerInfo.${idpProvider}.expiresAt`] = this.providerInfo.expiresAt;
			}
			if (!this.providerInfo.nrUserId) {
				this.wasIDPSocialSignup = true;
			}
			mustUpdate = true;
		}

		// check if this was a New Relic IDP sign-up, in which case the returned token actually becomes
		// our access token
		if (await this.checkIDPSignin(op)) {
			mustUpdate = true;
		}

		if (!mustUpdate) {
			return;
		}
		
		// perform the update
		this.request.log('NEWRELIC IDP TRACK: Provider identity connecting updating providerInfo');
		this.transforms.userUpdate = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// check if this was a New Relic IDP signin, in which case the returned token actually becomes
	// our access token
	async checkIDPSignin (op) {
		const teamId = this.company ? this.company.get('everyoneTeamId') : (this.user.get('teamIds') || [])[0];

		// only applies to newrelicidp, and if the user is joining or has joined an org
		if (this.provider !== 'newrelicidp' || !teamId) {
			return;
		}

		// not relevant if auth through Service Gateway is not enabled
		const serviceGatewayAuth = await this.api.data.globals.getOneByQuery(
			{ tag: 'serviceGatewayAuth' }, 
			{ overrideHintRequired: true }
		);
		const isServiceGatewayAuth = serviceGatewayAuth && serviceGatewayAuth.enabled;
		if (isServiceGatewayAuth) {
			this.request.log('This is New Relic IDP signin with Service Gateway auth enabled, storing user access token...');
		}

		delete op.$set['providerInfo.newrelic'];
		const rootStr = `providerInfo.${teamId}.newrelic`;
		op.$set[`${rootStr}.accessToken`] = this.tokenData.accessToken;
		op.$set[`${rootStr}.bearerToken`] = true;
		if (isServiceGatewayAuth) {
			op.$set['accessTokens.web.token'] = this.tokenData.accessToken;
			op.$set['accessTokens.web.isNRToken'] = true;
		}
		if (this.tokenData.refreshToken) {
			op.$set[`${rootStr}.refreshToken`] = this.tokenData.refreshToken;
			op.$set[`${rootStr}.expiresAt`] = this.tokenData.expiresAt;
			if (isServiceGatewayAuth) {
				op.$set['accessTokens.web.refreshToken'] = this.tokenData.refreshToken;
				op.$set['accessTokens.web.expiresAt'] = this.tokenData.expiresAt;
			}
		}
		if (this.tokenData.provider) {
			op.$set[`${rootStr}.provider`] = this.tokenData.provider;
			if (isServiceGatewayAuth) {
				op.$set['accessTokens.web.provider'] = this.tokenData.provider;
			}
		}

		const preferences = this.user.get('preferences') || {};
		if (!preferences.hasDoneNRLogin) {
			this.request.log('User logging in under New Relic login for first time, setting hasDoneNRLogin preference');
			op.$set['preferences.hasDoneNRLogin'] = true;
		}

		this.request.log('NEWRELIC IDP TRACK: User provider info was adjusted for IDP signin');
		return true;
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
			notRealLogin: true
		}).confirm(userData);
		this.userWasConfirmed = true;
	}
}

module.exports = ProviderIdentityConnector;