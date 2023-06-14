'use strict';

const AddTeamMembers = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/add_team_members');
const AddTeamPublisher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/add_team_publisher');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const Indexes = require('./indexes');
const UserCreator = require('./user_creator');
const UserDeleter = require('./user_deleter');
const UserAttributes = require('./user_attributes');
const EligibleJoinCompaniesPublisher = require('./eligible_join_companies_publisher');
const IsCodeStreamOnly = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/is_codestream_only');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class JoinCompanyHelper {

	constructor (options) {
		Object.assign(this, options);
		['api', 'data', 'transforms', 'errorHandler'].forEach(_ => {
			this[_] = this.request[_];
		});
		this.responseData = {};
	}

	// authorize the request for the current user
	async authorize () {
		this.request.log('NOTE: join-company request allowed in one-user-per-org paradigm');

		// get the company
		this.company = await this.data.companies.getById(this.companyId);
		if (!this.company || this.company.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		// get the company's everyone team
		this.team = await this.data.teams.getById(this.company.get('everyoneTeamId'));
		if (!this.team) {
			throw this.errorHandler.error('notFound', { info: 'team' }); // shouldn't happen
		}

		// since the user joining won't have a New Relic token (yet), we need to find the creator or
		// an admin that has one, to do the codestream-only check
		let admin;
		if (!this.request.request.headers['x-cs-no-newrelic'] && this.request.request.headers['x-cs-enable-uid']) {
			admin = await this.findFirstAdminWithNRToken(this.request);
			if (!admin) {
				throw this.errorHandler.error('notAuthorizedToJoin', { reason: 'team has no active admin with an NR token and management by New Relic cannot be determined' });
			}
		}

		// check whether the company is marked as "codestream-only", and whether its linked NR org
		// is also "codestream-only", which is the only scenario under which domain joining is possible
		const codestreamOnly = await IsCodeStreamOnly(this.company, this.request, admin);
		if (!codestreamOnly) {
			await this.request.persist();
			await this.publishCompanyNoCSOnly();
			throw this.errorHandler.error('notAuthorizedToJoin', { reason: 'membership in this company is managed by New Relic' });
		}

		// get the user record that corresponds to this user's invite
		// note that the user can sign-up using a different email than the one they were invited with
		const email = this.originalEmail || this.user.get('email'); 
		const matchingUsers = await this.data.users.getByQuery(
			{
				searchableEmail: email.toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);

		this.invitedUser = matchingUsers.find(user => {
			const teamIds = user.get('teamIds') || [];
			return (
				!user.get('deactivated') &&
				teamIds.length === 1 &&
				teamIds[0] === this.team.id
			);
		});
		if (this.invitedUser) {
			return;
		}

		// check that the user's email domain matches whatever domain-based joining the company has enabled
		const domains = this.company.get('domainJoining') || [];
		const userDomain = EmailUtilities.parseEmail(this.user.get('email')).domain.toLowerCase();
		if (this.inviteOnly || !domains.includes(userDomain)) {
			throw this.errorHandler.error('notAuthorizedToJoin');
		}

		this.joinMethod = 'Joined Team by Domain';
	}

	// process the request
	async process () {
		await this.checkServiceGatewayAuth();
		await this.checkUnique();
		if (!this.invitedUser) {
			this.invitedUser = await this.duplicateUser();
		}
		await this.confirmUser();
		await this.addUserToTeam();
		await this.handleIdPSignup();

		// if the original user is teamless, basically meaning they just confirmed,
		// and are now joining a company, delete the original user record
		if ((this.user.get('teamIds') || []).length === 0) {
			await new UserDeleter({
				request: this
			}).deleteUser(this.user.id);
		}

		// for tests, pass the updated user back in the response
		if (this.request.request.headers['x-cs-confirmation-cheat'] === this.api.config.sharedSecrets.confirmationCheat) {
			this.request.warn('NOTE: passing user object back in join-company request, this had better be a test!');
			this.responseData.user = this.invitedUser.getSanitizedObjectForMe({ request: this });
			this.responseData.broadcasterToken = this.invitedUser.get('broadcasterToken');
			this.responseData.user.version++;
		}
	}

	// check if we are using Service Gateway auth (login service)
	async checkServiceGatewayAuth () {
		const serviceGatewayAuth = await this.api.data.globals.getOneByQuery(
			{ tag: 'serviceGatewayAuth' }, 
			{ overrideHintRequired: true }
		);
		this.serviceGatewayAuth = serviceGatewayAuth && serviceGatewayAuth.enabled;
	}

	// check if the joining user's email will be unique in the organization
	async checkUnique () {
		const numMatchingUsers = await this.request.data.users.countByQuery(
			{
				searchableEmail: this.user.get('email').toLowerCase(),
				isRegistered: true,
				teamIds: this.team.id
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);
		if (numMatchingUsers > 0) {
			throw this.errorHandler.error('emailTaken');
		}
	}

	// under one-user-per-org, joining a company by virtue of domain joining (no invite) means
	// duplicating the user record for the joining user
	async duplicateUser () {
		const userData = {
			copiedFromUserId: this.user.id
		};
		const attributesToCopy = Object.keys(UserAttributes).filter(attr => {
			return UserAttributes[attr].copyOnInvite;
		});
		attributesToCopy.forEach(attribute => {
			const value = this.user.get(attribute);
			if (typeof value !== undefined) {
				userData[attribute] = value;
			}
		});
		return new UserCreator({ 
			request: this.request,
			force: true
		}).createUser(userData);
	}

	// under one-user-per-org, accepting an invite means confirming the user record for the unregistered
	// user who has been created as a result of the invite
	async confirmUser () {
		// in the case of a user accepting an invite, they might have signed up with an email different
		// from the email they were originally invited with, here we detect that scenario and make sure
		// the invited user record has the correct email
		if (this.user.get('email') !== this.invitedUser.get('email') && this.user.get('originalEmail')) {
			this.invitedUser.attributes.email = this.user.get('email');
			this.invitedUser.attributes.searchableEmail = this.user.get('email').toLowerCase();
			this.invitedUser.attributes.username = this.user.get('email').split('@')[0];
		}
		const accessToken = ((this.invitedUser.get('accessTokens') || {}).web || {}).token;
		if (accessToken) {
			this.responseData = {
				accessToken
			};
		} else {
			// only copy providerInfo if we are not doing New Relic IdP, if we are, the provider credentials
			// will be set separately
			const providerInfo = this.request.request.headers['x-cs-enable-uid'] ? undefined : this.user.get('providerInfo');
			const providerIdentities = this.request.request.headers['x-cs-enable-uid'] ? undefined : this.user.get('providerIdentities');
			this.responseData = await new this.confirmHelperClass({ // avoids a circular require
				request: this.request,
				user: this.invitedUser,
				notRealLogin: true,
				dontGenerateAccessToken: this.serviceGatewayAuth
			}).confirm({
				email: this.user.get('email'),
				username: this.user.get('username'),
				passwordHash: this.user.get('passwordHash'),
				providerInfo,
				providerIdentities
			});
		}

		Object.assign(this.responseData, {
			userId: this.invitedUser.id,
			teamId: this.team.id
		});
	}

	// add the invited user to the everyone team for the company
	async addUserToTeam () {
		await new AddTeamMembers({
			request: this,
			addUsers: [this.invitedUser],
			team: this.team,
			joinMethod: this.joinMethod
		}).addTeamMembers();
	}

	// upon joining company creation is where we first register the user with our third-party Identity Provider
	// (i.e. NewRelic/Azure) ... even if the user is joining a second org, under one-user-per-org,
	// it's more or less functionally the same as signing up
	async handleIdPSignup () {
		if (!this.api.services.idp) { return; }
		if (!this.request.request.headers['x-cs-enable-uid']) { return; }
		let mockResponse;
		if (this.request.request.headers['x-cs-no-newrelic']) {
			mockResponse = true;
			this.request.log('NOTE: not handling IDP signup, sending mock response');
		}

		const encryptedPassword = this.user.get('encryptedPasswordTemp');
		if (encryptedPassword) {
			this.password = await this.decryptPassword(encryptedPassword);
		}

		const nrOrgInfo = this.company.get('nrOrgInfo');
		if (!nrOrgInfo) {
			// shouldn't happen
			throw this.errorHandler.error('createAuth', { reason: 'company does not have New Relic org info' });
		}

		const name = this.invitedUser.get('fullName') || this.invitedUser.get('email').split('@')[0];
		const { nrUserInfo, tokenInfo } = await this.api.services.idp.createUserWithPassword(
			{
				name,
				email: this.invitedUser.get('email'),
				authentication_domain_id: nrOrgInfo.authentication_domain_id,
				email_is_verified: true,
				active: true
			},
			this.password,
			{ 
				request: this,
				mockResponse
			}
		);
		this.password = this.password || tokenInfo.generatedPassword;

		// for some insane reason, the ID comes out as a string 
		if (typeof nrUserInfo.id === 'string') {
			nrUserInfo.id = parseInt(nrUserInfo.id, 10);
			if (!nrUserInfo.id || isNaN(nrUserInfo.id)) {
				throw this.errorHandler.error('internal', { reason: 'created user had non-numeric ID from New Relic' });
			}
		}

		const { token, refreshToken, expiresAt } = tokenInfo;
		const set = {
			nrUserInfo: {
				userTier: nrUserInfo.attributes.userTier,
				userTierId: nrUserInfo.attributes.userTierId
			},
			nrUserId: nrUserInfo.id,
			/*
			[ `providerInfo.${this.team.id}.newrelic.accessToken` ]: token,
			[ `providerInfo.${this.team.id}.newrelic.refreshToken` ]: refreshToken,
			[ `providerInfo.${this.team.id}.newrelic.expiresAt` ]: expiresAt,
			[ `providerInfo.${this.team.id}.newrelic.bearerToken` ]: true
			*/
		};

		// make sure we copy (teamless) providerInfo from the original user
		set.providerInfo = this.user.get('providerInfo') || {};
		set.providerInfo[this.team.id] = {
			newrelic: {
				accessToken: token,
				refreshToken,
				expiresAt,
				bearerToken: true
			}
		};

		// if we are behind service gateway and using login service auth, we actually set the user's
		// access token to the NR access token, this will be used for normal requests
		if (this.serviceGatewayAuth) {
			set['accessTokens.web'] = { 
				token,
				isNRToken: true,
				refreshToken,
				expiresAt
			};
			this.responseData.accessToken = token;
		}

		// save NR user info obtained from the signup process
		const op = {
			$set: set,
			$unset: {
				encryptedPasswordTemp: true,
				joinCompanyId: true,
				originalEmail: true
			}
		};
console.warn('************************************************************************************************');
console.warn('Setting user token info after handling IDP signup:', JSON.stringify(op, 0, 5));
console.warn('************************************************************************************************');
			
		await this.data.users.applyOpById(this.invitedUser.id, op);
	}

	// decrypt the user's stored password, which is encrypted upon registration for
	// temporary maintenance during the signup flow
	async decryptPassword (encryptedPassword) {
		return this.api.services.passwordEncrypt.decryptPassword(encryptedPassword);
	}
	
	// after the join is complete and response returned...
	async postProcess () {
		// publish to the team that the users have been added,
		// and publish to each user that they've been added to the team
		await new AddTeamPublisher({
			request: this.request,
			broadcaster: this.api.services.broadcaster,
			users: [this.invitedUser],
			team: this.team,
			teamUpdate: this.transforms.teamUpdate
		}).publishAddedUsers();

		// publish to all registered users the resulting change in eligibleJoinCompanies
		await new EligibleJoinCompaniesPublisher({
			request: this.request,
			broadcaster: this.api.services.broadcaster
		}).publishEligibleJoinCompanies(this.invitedUser.get('email'));

		// if the user changed their email during signup to one different from the one they were invited to,
		// we need to also publish eligible join companies to that email
		if (this.originalEmail) {
			await new EligibleJoinCompaniesPublisher({
				request: this.request,
				broadcaster: this.api.services.broadcaster
			}).publishEligibleJoinCompanies(this.originalEmail);
		}

		// evidently there is some kind of race condition in the Azure B2C API which causes
		// the refresh token first issued on the login request to be invalid, so here we return
		// a response to the client with a valid access token, but knowing the refresh token
		// isn't valid ... but we'll fetch a new refresh token after a generous period of time 
		// to allow the race condition to clear
		await this.updateRefreshToken();
	}

	// evidently there is some kind of race condition in the Azure B2C API which causes
	// the refresh token first issued on the login request to be invalid, so here we return
	// a response to the client with a valid access token, but knowing the refresh token
	// isn't valid ... but we'll fetch a new refresh token after a generous period of time 
	// to allow the race condition to clear
	async updateRefreshToken () {
		if (this.request.request.headers['x-cs-no-newrelic'] || !this.request.request.headers['x-cs-enable-uid']) {
			return;
		}

console.warn('WAITING FOR REFRESH TOKEN WITH PASSWORD:', this.password);
		const tokenInfo = await this.api.services.idp.waitForRefreshToken(
			this.invitedUser.get('email'),
			this.password,
			{ request: this.request }
		);

		// save the new refresh token to the database...
		const { token, refreshToken, expiresAt, provider } = tokenInfo;
		const op = { 
			$set: {
				[ `providerInfo.${this.team.id}.newrelic.accessToken` ]: token,
				[ `providerInfo.${this.team.id}.newrelic.refreshToken` ]: refreshToken,
				[ `providerInfo.${this.team.id}.newrelic.expiresAt` ]: expiresAt,
				[ `providerInfo.${this.team.id}.newrelic.provider` ]: provider
			}
		};
		if (this.serviceGatewayAuth) {
			Object.assign(op.$set, {
				[ `accessTokens.web.token`]: token,
				[ `accessTokens.web.refreshToken`]: refreshToken,
				[ `accessTokens.web.expiresAt`]: expiresAt,
				[ `accessTokens.web.provider`]: provider
			});
		}
		const updateOp = await new ModelSaver({
			request: this.request,
			collection: this.data.users,
			id: this.invitedUser.id
		}).save(op);
		await this.request.postProcessPersist();

		// ...and publish a message that it has been updated to the user
		const message = {
			requestId: this.request.request.id,
			user: updateOp
		};
		const channel = `user-${this.invitedUser.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this.request	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish refresh token update message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// if the company object has changed (because it was found to no longer be "codestream only"),
	// publish the change to the team channel
	async publishCompanyNoCSOnly () {
		if (!this.transforms.updateCompanyNoCSOnly) {
			return;
		}

		// publish the change to all users on the "everyone" team
		const channel = 'team-' + this.company.get('everyoneTeamId');
		const message = {
			company: this.transforms.updateCompanyNoCSOnly,
			requestId: this.request.request.id
		};;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.request.warn(`Could not publish updated company message to team ${this.company.get('everyoneTeamId')}: ${JSON.stringify(error)}`);
		}
	}

	// find the first admin of a team with an NR token
	async findFirstAdminWithNRToken (request) {
		const adminIds = this.team.get('adminIds') || [];
		if (!adminIds.includes(this.team.get('creatorId'))) {
			adminIds.unshift(this.team.get('creatorId'));
		}

		let admin, providerInfo;
		for (let adminId of adminIds) {
			admin = await this.data.users.getById(adminId);
			if (admin.get('deactivated')) continue;

			const teamProviderInfo = (
				admin.get('providerInfo') &&
				admin.get('providerInfo')[this.team.id] &&
				admin.get('providerInfo')[this.team.id].newrelic
			);
			const userProviderInfo = (
				admin.get('providerInfo') &&
				admin.get('providerInfo').newrelic
			);
			if (teamProviderInfo && teamProviderInfo.accessToken) {
				providerInfo = teamProviderInfo;
			} else if (userProviderInfo && userProviderInfo.accessToken) {
				providerInfo = userProviderInfo;
			}
			if (providerInfo) break;
		}
		if (providerInfo) {
			return admin;
		}
	}

	// describe this route for help
	static describe (module) {
		return {
			tag: 'join-company',
			summary: 'Join a company based on domain or code host',
			access: 'The company must have domain-based joining enabled for a domain matching the domain of the user\'s email address',
			description: 'Current user joining a team which has domain-based joining enabled, based on the user\'s email domain',
			input: 'Specify the company ID in the path, no other input required',
			returns: {
				summary: 'A user object, with directives to update to the user model, the company object, and a team object representing the company\'s everyone team',
				looksLike: {
					user: '<directives>',
					team: '<team object>',
					company: '<company object>'
				}
			},
			publishes: {
				summary: 'The response data will be published on the user channel for the user joining the team, other updates will be published on the team channel for the everyone team for the company ',
			},
			errors: [
				'updateAuth',
				'notFound',
				'notAuthorizedToJoin'
			]
		};
	}
}

module.exports = JoinCompanyHelper;
