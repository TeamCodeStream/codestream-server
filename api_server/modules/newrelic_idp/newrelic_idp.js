// handle interactions with New Reclic's Identity Provider service

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const Fetch = require('node-fetch');
const Crypto = require('crypto');
const UUID = require('uuid').v4;
const NerdGraphOps = require('./nerd_graph_ops');
//const NewRelicListener = require('./newrelic_listener');
const RandomString = require('randomstring');
const JWT = require('jsonwebtoken');
const GithubAuthorizer = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/github_auth/github_authorizer');
const GitlabAuthorizer = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/gitlab_auth/gitlab_authorizer');
const BitbucketAuthorizer = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/bitbucket_auth/bitbucket_authorizer');
const NewRelicIDPConstants = require('./newrelic_idp_constants');

class NewRelicIDP extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the interface to New Relic IDP
		// as the IDP service
		return async () => {
			return { 
				idp: this,
				newrelicidpAuth: this
			};
		};
	}

	async initialize (config = null) {
		this.apiConfig = config || (this.api && this.api.config);
		if (!this.apiConfig) {
			throw new Error('no config provided');
		}
		const identityConfig = this.apiConfig.integrations.newRelicIdentity;
		this.serviceHosts = {
			'signup': identityConfig.signupServiceHost,
			'user': identityConfig.userServiceHost,
			'login': identityConfig.loginServiceHost,
			'credentials': identityConfig.credentialsServiceHost,
			'org': identityConfig.orgServiceHost,
			'idp': identityConfig.idpServiceHost,
			'graphql': identityConfig.graphQLHost
		};
		/*
		if (this.api) {
			this.listener = new NewRelicListener({ api: this.api });
			this.listener.listen();
		}
		*/
	}

	async createUserWithPassword (attributes, password, options = {}) {
		if (options.request) options.request.log('NEWRELIC IDP TRACK: Creating user using NR create user API...');
		
		// first create the actual user
		const createUserResponse = await this.createUser(attributes, options);
let passwordGenerated = false;
if (!password) {
	// FIXME ... this is temporary, until we have a place to go to finish this signup flow
	// in the case of social signup
	if (options.request) options.request.log('NEWRELIC IDP TRACK: NR createUser has no password, generating one...');
	password = RandomString.generate(20) + '1!';
	passwordGenerated = true;
}
		if (options.request) options.request.log('NEWRELIC IDP TRACK: Setting user password on Azure/NR...');

		// this sets the password on azure ... this call should be removed once the credentials
		// service handles syncing the azure password itself from the code below
		const idpId = createUserResponse.data.attributes.activeIdpObjectId;
		await this._newrelic_idp_call(
			'idp',
			`/${NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY}/users/${idpId}/password`,
			'post',
			{
				password
			},
			options
		);

		// now create a "pending password" using the credentials service,
		// since the createUser API doesn't take a password 
		const pendingPasswordResponse = await this._newrelic_idp_call(
			'credentials',
			'/v1/pending_passwords',
			'post',
			{
				data: {
					type: 'pendingPassword',
					attributes: {
						password,
						passwordConfirmation: password
					}
				}
			},
			options
		);

		// now apply the "pending password" to the user
		await this._newrelic_idp_call(
			'credentials',
			`/v1/pending_passwords/${pendingPasswordResponse.data.id}/apply/${createUserResponse.data.id}`,
			'post',
			{
				timestamp: Date.now(),
				request_id: UUID()
			},
			options
		);

		// user needs to be added to the default user group
		await this.addUserToUserGroup(createUserResponse.data.id, attributes.authentication_domain_id, options);

		// login user to get an ID token
		if (options.request) options.request.log('NEWRELIC IDP TRACK: Calling NR login service with email/password to get ID token...');
		const loginResponse = await this.loginUser(
			{
				username: attributes.email,
				password
			},
			options
		);

		// if we're doing migration, flag the user as needing to verify their password before first login
		if (options.setIDPPassword) {
			await this.setIDPMigration(idpId, options);
		}

		const nrUserInfo = createUserResponse.data;
		const tokenInfo = {
			token: loginResponse.idp.id_token,
			/*
			// This is invalid until we do waitForRefreshToken, below
			refreshToken: loginResponse.idp.refresh_token,
			expiresAt: Date.now() + loginResponse.idp.expires_in * 1000
			*/
			generatedPassword: passwordGenerated && password
		};
		return { nrUserInfo, tokenInfo };
	}

	// evidently there is some kind of race condition in the Azure B2C API which causes
	// the refresh token first issued on the login request to be invalid, so here we return
	// a response to the client with a valid access token, but knowing the refresh token
	// isn't valid ... but we'll fetch a new refresh token after a generous period of time 
	// to allow the race condition to clear
	async waitForRefreshToken (email, password, options) {
		const mockMode = options.request.api.config.apiServer.mockMode;
		const wait = options.request.request.headers['x-cs-no-newrelic'] ? (mockMode ? 1500 : 7500) : 10000;
		await new Promise(resolve => { setTimeout(resolve, wait); });
		const now = Date.now();
		options.request.log('Doing post-login token refresh through New Relic IDP...');		
		options.request.log('NEWRELIC IDP TRACK: Doing delayed NR login, for refresh token...');
		const loginResponse = await this.loginUser(
		{
				username: email,
				password
			},
			options
		);
		return {
			token: loginResponse.idp.id_token,
			refreshToken: loginResponse.idp.refresh_token,
			expiresAt: Date.now() + loginResponse.idp.expires_in * 1000,
			provider: NewRelicIDPConstants.NR_AZURE_PASSWORD_POLICY
		};
	}

	async createUser (attributes, options = {}) {
		const body = {
			data: {
				type: 'user',
				attributes
			}
		}
		
		return this._newrelic_idp_call(
			'user',
			'/v1/users',
			'post',
			body,
			options
		);
	}

	// do a full signup, which includes the actual signup API call, 
	// as well as a "login" call thereafter to return an actual token 
	// the user can use
	async fullSignup (data, options = {}) {

let passwordGenerated = false;
if (!data.password) {
	// FIXME ... this is temporary, until we have a place to go to finish this signup flow
	// in the case of social signup
	if (options.request) options.request.log('NEWRELIC IDP TRACK: No password provided to fullSignup, generating random...');
	data.password = RandomString.generate(20) + '1!';
	passwordGenerated = true;
}

		if (options.mockResponse) {
			options.mockParams = {
				email: data.email,
				name: data.name,
				userTier: 'full_user_tier'
			};
		}

		if (options.request) options.request.log('NEWRELIC IDP TRACK: Signing up user with NR provision API...');
		const signupResponse = await this.signupUser({
			name: data.name,
			email: data.email,
			password: data.password
		}, options);

		if (options.request) options.request.log('NEWRELIC IDP TRACK: Logging user in using login service, with email and password...');
		if (options.mockResponse) {
			options.mockNRUserId = signupResponse.user_id;
		}
		const loginResponse = await this.loginUser(
			{
				username: data.email,
				password: data.password
			},
			options
		);

		if (data.orgName) {
			await this.changeOrgName(signupResponse.organization_id, data.orgName, options);
		}

		// get user info so we can get the user's tier info
		const userInfo = await this.getUser(signupResponse.user_id, options);

		// if we're doing migration, flag the user as needing to verify their password before first login
		if (options.setIDPPassword) {
			await this.setIDPMigration(userInfo.data.attributes.activeIdpObjectId, options);
		}

		return {
			signupResponse,
			nrUserInfo: userInfo.data,
			token: loginResponse.idp.id_token,
			/*
			// This is invalid until we do waitForRefreshToken
			refreshToken: loginResponse.idp.refresh_token,
			expiresAt: Date.now() + loginResponse.idp.expires_in * 1000,
			*/
			bearerToken: true,
			generatedPassword: passwordGenerated && data.password
		};
	}

	async signupUser (data, options = {}) {
		const region = this.apiConfig.integrations.newRelicIdentity.newRelicRegion;
		return this._newrelic_idp_call(
			'signup',
			'/internal/v1/signups/provision',
			'post',
			{ 
				user: data,
				account: { region }
			},
			options
		);
	}

	async loginUser (data, options = {}) {
		return this._newrelic_idp_call(
			'login',
			`/idp/${NewRelicIDPConstants.NR_AZURE_PASSWORD_POLICY}/token`,
			'post',
			data,
			options
		);
	}


	async listUsers (email, options = {}) {
		return this._newrelic_idp_call(
			'user',
			'/v1/users',
			'get',
			{ email },
			options
		);
	}

	async getUser (id, options = {}) {
		return this._newrelic_idp_call(
			'user',
			'/v1/users/' + id,
			'get',
			undefined,
			options
		);
	}

	async getUsersByAuthDomain (domainId, options = {}) {
		const result = await this._newrelic_idp_call(
			'user',
			'/v1/users',
			'get',
			{ 
				authentication_domain_id: domainId
			},
			options
		);
		return (
			result &&
			result.data
		);
	}

	async getUsersByOrg (orgId, options = {}) {
		const authDomains = await this.getAuthDomains(orgId, options);
		let users = [];
		await Promise.all(authDomains.map(async authDomainId => {
			const authDomainUsers = await this.getUsersByAuthDomain(authDomainId, options);
			users = [...users, ...authDomainUsers];
		}));
		return users;
	}
	async getUsersByUsername (username, options = {}) {
		return this._newrelic_idp_call(
			'user',
			'/v1/users',
			'get',
			{
				username
			},
			options
		);
	}

	async addUserToUserGroup (userId, authDomainId, options = {}) {
		if (options.mockResponse) {
			// punt on this for now, not really relevant in test mode
			return;
		}

		// fetch groups under this auth domain
		const groupsResponse = await this._newrelic_idp_call(
			'user',
			'/v1/groups',
			'get',
			{
				authentication_domain_id: authDomainId
			},
			options
		);

		// find the "User" group, we can be (more or less) assured that this is the right group,
		// because user invites only work for CS-only orgs, and in CS-only orgs, no group restructuring
		// could possibly take place, so it is reasonable to assume we have the default groups here
		// for a newly created org
		const group = groupsResponse.data.find(group => group.attributes.displayName === 'User');
		if (!group) {
			return; // oh well???
		}

		// add the given user to this group
		await this._newrelic_idp_call(
			'user',
			'/v1/group_memberships',
			'post',
			{
				data: {
					type: 'groupMembership',
					attributes: {
						group_id: group.id,
						user_id: userId
					}
				}
			},
			options
		);
	}

	// get the current user, associated with the passed token
	async getCurrentUser (token, tokenType, options = {}) {
		const ngOps = new NerdGraphOps({
			request: options.request,
			accessToken: token,
			tokenType
		});
		await ngOps.init();
		return ngOps.getCurrentUser(options);
	}

	async updateUser (id, data, options = {}) {
		const user = await this.getUser(id, options);
		if (!user) return null;
		const { attributes } = user.data;
		data = Object.assign({
			email: attributes.email,
			name: attributes.name
		}, data);
		return this._newrelic_idp_call(
			'user',
			'/v1/users/' + id,
			'patch',
			{ data: { attributes: data } },
			options
		);
	}

	async deleteUser (id, codestreamTeamId, options = {}) {
		// use the NerdGraphOps, which makes a graphql call to delete the user
		const ngOps = new NerdGraphOps({
			request: options.request,
			teamId: codestreamTeamId // used to get the user's API key, to make a nerdgraph request
		});
		await ngOps.init();
		return ngOps.deleteUser(id, options);
	}

	// return the region code associated with a particular account
	async regionFromAccountId (accountId, accessToken, tokenType, options = {}) {
		if (options.request.request.headers['x-cs-no-newrelic']) {
			options.request.log('Returning mock response of us01 for region');
			return 'us01';
		}

		// use the NerdGraphOps, which makes a graphql call 
		const ngOps = new NerdGraphOps({
			request: options.request,
			accessToken,
			tokenType
		});
		await ngOps.init();
		return ngOps.regionFromAccountId(accountId);
	}

	// determine whether an NR org qualifies as "codestream only"
	// currently, we need to examine whether it has the unlimited_consumption entitlement
	async isNROrgCodeStreamOnly (nrOrgId, codestreamTeamId, options = {}) {
		/*
		// until we can get a valid token back from the signup or login process, we don't have a way to
		// make the entitlements API call, so return true for now until that blocker is fixed
		*/
		//return true;


		// before determining if the org has the unlimited_consumption entitlement,
		// we need to get its reporting account
		const accountId = await this.getOrgReportingAccount(nrOrgId, options);
		if (!accountId) {
			this._throw('nrIDPInternal', `could not get reporting account for NR Org ID ${nrOrgId}`, options);
		}
		options.request.log(`NEWRELIC IDP TRACK: accountId=${accountId}`);
		
		// use the NerdGraphOps, which makes a graphql call to get the entitlements
		// for this account ... if it DOES NOT have the entitlement, it can still be codestream-only
		options.request.log('NEWRELIC IDP TRACK: Checking if this org has the unlimited consumption entitlement...');
		const ngOps = new NerdGraphOps({
			request: options.request,
			teamId: codestreamTeamId, // used to get the user's API key, to make a nerdgraph request
			adminUser: options.adminUser // grab token or API key from this admin user, instead of the requesting user
		});
		await ngOps.init();
		const hasEntitlement = await ngOps.nrOrgHasUnlimitedConsumptionEntitlement(accountId, options);
		options.request.log('NEWRELIC IDP TRACK: hasEntitlement=' + hasEntitlement);
		return !hasEntitlement;
	}

	// get the auth domains associated with a particular NR org
	async getAuthDomains (nrOrgId, options) {
		const result = await this._newrelic_idp_call(
			'org',
			`/v0/organizations/${nrOrgId}/authentication_domains`,
			'get',
			undefined,
			options
		);

		return (
			result.data &&
			result.data.map(_ => _.id)
		);

	}

	// get a single auth domain, by ID
	async getAuthDomain (authDomainId, options = {}) {
		return this._newrelic_idp_call(
			'org',
			`/v0/authentication_domains/${authDomainId}`,
			'get',
			undefined,
			options
		);
	}

	// get the org given an NR org ID
	async getOrg (nrOrgId, options = {}) {
		const result = await this._newrelic_idp_call(
			'org',
			'/v0/organizations/' + nrOrgId,
			'get',
			undefined,
			options
		);
		if (options.mockOrg) {
			Object.assign(result.data.attributes, options.mockOrg);
		}
		return result.data && result.data.attributes;
	}
	
	// get the "reporting account" for the given NR org ID
	async getOrgReportingAccount (nrOrgId, options) {
		const org = await this.getOrg(nrOrgId, options);
		return org && org.reportingAccountId;
	}

	// change an organization name for the given org ID
	async changeOrgName (nrOrgId, name, options) {
		const result = await this._newrelic_idp_call(
			'org',
			'/v0/organizations/' + nrOrgId,
			'patch',
			{ data: { attributes: { name } } },
			options
		);
		return result;
	}

	// flag the user as being created during migration,
	// this ensures the user's password is verified against CodeStream the first time they login
	async setIDPMigration (userId, options = {}) {
		const result = await this._newrelic_idp_call(
			'idp',
			`/${NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY}/users/${userId}/set_codestream_idp_migration`,
			'post',
			{ migration_required: true },
			options
		);
	}

	// get the "possible" authentication domains for a user, which leads to all the orgs they're in, by email
	async getPossibleAuthDomains (token, tokenType, options = {}) {
		return [];
		const authHeader = Buffer.from(JSON.stringify({
			provider: NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY,
			token
		})).toString('base64');
		const result = await this._newrelic_idp_call(
			'login',
			'/api/v1/current_user/possible_authentication_domains.json',
			'get',
			{ },
			{ ...options, headers: { 'Authorization': authHeader } }
		);

		// remove v1 users
		return result.data.filter(domain => {
			return domain.user_id >= 1000000000;
		});
	}

	// get redirect parameters and url to use in the redirect response,
	// which looks like the beginning of an OAuth process, but isn't
	getRedirectData (options) {
		const host = this.serviceHosts.login;
		const { newRelicClientId } = this.apiConfig.integrations.newRelicIdentity;
		//const whichPath = options.noSignup ? 'cs' : 'cssignup';
		//const url = `${host}/idp/${NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY}-${whichPath}/redirect`;
		const url = `${host}/login`; //idp/${NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY}/redirect`;
		let signupToken = options.signupToken;
		if (options.joinCompanyId) {
			signupToken += `.JCID~${options.joinCompanyId}`;
		}
		if (options.anonUserId) {
			signupToken += `.AUID~${options.anonUserId}`;
		}
		if (options.noSignup) {
			signupToken += '.NOSU~1';
		}

		const data = { 
			url,
			parameters: {
				return_to: `${options.publicApiUrl}/~nrlogin/${signupToken}`,
				response_mode: 'code',
				//domain_hint: NewRelicIDPConstants.FEDERATION_ON_LOGIN ? (options.domain || 'newrelic.com') : undefined,
				client_id: newRelicClientId,
				scheme: 'codestream',
				force_login: 'true'
			}
		};
		if (options.nrUserId) {
			data.parameters.user_id = options.nrUserId;
		}
		return data;
	}

	// need this to act like an OAuth supporting module
	usesOauth1 () {
		return false;
	}

	// need this to act like an OAuth supporting module
	exchangeRequired () {
		return true;
	}

	// exchange auth code for access token, in the New Relic IDP world, this looks kind of like
	// OAuth, but really isn't
	async exchangeAuthCodeForToken (options) {
		const { newRelicClientId, newRelicClientSecret } = this.apiConfig.integrations.newRelicIdentity;
		const result = await this._newrelic_idp_call(
			'login',
			'/api/v1/tokens',
			'post',
			{
				client_id: newRelicClientId,
				client_secret: newRelicClientSecret,
				auth_code: options.code
			},
			options
		);
		let expiresAt;
		if (result.expires_at) {
			expiresAt = result.expires_at * 1000;
		} else {
			expiresAt = Date.now() + 1000 * (result.expires_in || 3600);
		}
		const tokenInfo = {
			accessToken: result.id_token || result.access_token,
			tokenType: result.id_token ? 'id' : 'access',
			refreshToken: result.refresh_token,
			provider: NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY,
			expiresAt
		};
		const showTokenInfo = { ...tokenInfo };
		showTokenInfo.accessToken = '<redacted>' + tokenInfo.accessToken.slice(-6);
		showTokenInfo.refreshToken = '<redacted>' + tokenInfo.refreshToken.slice(-6);
		options.request.log(`NEWRELIC IDP TRACK: Token info from exchange: ${JSON.stringify(showTokenInfo)}`);
		return tokenInfo;
	}

	// match the incoming New Relic identity to a CodeStream identity
	async getUserIdentity (options) {
		const user = await this.getCurrentUser(options.accessToken, options.tokenType, options);
		const identityInfo = {
			email: user.user.email,
			fullName: user.user.name,
			nrUserId: user.user.id,
			nrOrgId: user.organization.id
		};

		/*
		// decode the token, which is JWT, this will give us the NR User ID
		let payload;
		if (options.mockResponse) {
			if (options.accessToken.startsWith('MNRI-')) {
				const [, nrUserId, json] = options.accessToken.split('-');
				payload = Buffer.from(json, 'base64').toString();
				try {
					payload = JSON.parse(payload); 
				}
				catch (ex) {
					payload = {};
				}
			} else {
				payload = {};
			}
		} else {
			payload = JWT.decode(options.accessToken);
		}

		const showPayload = { ...payload };
		if (showPayload.idp_access_token) {
			showPayload.idp_access_token = '<redacted>' + payload.idp_access_token.slice(-7);
		}
		if (showPayload.idp_refresh_token) {
			showPayload.idp_refresh_token = '<redacted>' + payload.idp_refresh_token.slice(-7);
		}
		options.request.log('NEWRELIC IDP TRACK: ID token payload: ' + JSON.stringify(showPayload, 0, 5));
		const identityInfo = {
			email: payload.email,
			fullName: payload.name,
			nrUserId: payload.nr_userid,
			nrOrgId: payload.nr_orgid,
			idp: payload.idp,
			idpAccessToken: payload.idp_access_token,
			idpRefreshToken: payload.idp_refresh_token,
			userId: payload.oid
		};
		if (payload.idp_access_token_expires_in) {
			identityInfo.expiresAt = Date.now() + (payload.idp_access_token_expires_in - 60) * 1000;
		}

		// the refresh token we get from New Relic is stringified JSON
		if (identityInfo.idpRefreshToken && identityInfo.idpRefreshToken.startsWith('{')) {
			let parsedRefreshToken;
			try {
				parsedRefreshToken = JSON.parse(identityInfo.idpRefreshToken);
				if (parsedRefreshToken.r) {
					identityInfo.idpRefreshToken = parsedRefreshToken.r;
				}
			}
			catch (ex) {
			}
		}
		*/

		// extract company name and region as needed
		if (identityInfo.nrOrgId) {
			const org = await this.getOrg(identityInfo.nrOrgId, options);
			identityInfo.companyName = org.name;
			// unfortunately it seems we need to wait a bit before the token that was issued by Azure/New Relic
			// can be used for a NerdGraph call, hopefully 2 seconds is enough...
			let done = false; 
			let lastEx = null;
			for (let i = 0; i < 10 && !done; i++) {
				done = await new Promise(async resolve => {
					setTimeout(async () => {
						try {
							identityInfo.region = await this.regionFromAccountId(org.reportingAccountId, options.accessToken, options.tokenType, options);
							options.request.log(`NEWRELIC IDP TRACK: region determined to be ${identityInfo.region} after ${i} tries`);
						} catch (ex) {
							lastEx = ex;
							resolve(false);
						}
						resolve(true);
					}, 200);
				});
			}
			if (!done) {
				options.request.log(`NEWRELIC IDP TRACK: Could not determine region after 10 tries, last Exception: ${JSON.stringify(lastEx)}`);
			}
		}
		
		// extract user ID and info as needed
		if (identityInfo.nrUserId) {
			const userInfo = await this.getUser(identityInfo.nrUserId, options);
			//identityInfo.nrUserId = parseInt(payload.nr_userid, 10);
			identityInfo.nrUserInfo = {
				userTierId: userInfo.data?.attributes?.userTierId,
				userTier: userInfo.data?.attributes?.userTier
			};
		}

		/*
		if (payload.idp && payload.idp_access_token) {
			let idpInfo;
			if (payload.idp && payload.idp === 'github.com') {
				idpInfo = await this.getGitHubIdentityInfo(payload.idp_access_token, options);
			} else if (payload.idp && payload.idp === 'gitlab.com') {
				idpInfo = await this.getGitLabIdentityInfo(payload.idp_access_token, options);
			} else if (payload.idp && payload.idp === 'bitbucket.org') {
				idpInfo = await this.getBitbucketIdentityInfo(payload.idp_access_token, options);
			}
			delete idpInfo.accessToken;
			const showInfo = { ...idpInfo };
			options.request.log('Additional identity info: ' + JSON.stringify(showInfo, 0, 5));
			const email = identityInfo.email;
			Object.assign(identityInfo, idpInfo);
			if (!identityInfo.email) identityInfo.email = email;
		}
		*/
		return identityInfo;
	}

	async getGitHubIdentityInfo (token, options) {
		options.request.log('Getting additional identitying info from Github...');
		const authorizer = new GithubAuthorizer({ options: { request: options.request } });
		return authorizer.getGithubIdentity(token);
	}
	
	async getGitLabIdentityInfo (token, options) {
		options.request.log('NEWRELIC IDP TRACK: Getting additional identitying info from Gitlab...');
		const authorizer = new GitlabAuthorizer({ options: { request: options.request }, ignoreNoPublicEmail: true });
		return authorizer.getGitlabIdentity(token);
	}
	
	async getBitbucketIdentityInfo (token, options) {
		options.request.log('NEWRELIC IDP TRACK: Getting additional identitying info from Bitbucket...');
		const authorizer = new BitbucketAuthorizer({ options: { request: options.request } });
		return authorizer.getBitbucketIdentity(token);
	}
	
	getAuthCompletePage () {
		return 'newrelic';
	}
	
	supportsRefresh () {
		return true;
	}
	
	// extract the cookie New Relic sends us in the callback to the New Relic login process
	extractCookieFromRequest (request) {
		if (!request.headers || !request.headers.cookie) {

		}
	}

	// refresh a user's token
	async refreshToken (refreshToken, provider, options) {
		const { newRelicClientId, newRelicClientSecret } = this.apiConfig.integrations.newRelicIdentity;
		return this._newrelic_idp_call(
			'login',
			'/api/v1/tokens/refresh',
			'post',
			{
				refresh_token: refreshToken,
				client_id: newRelicClientId,
				client_secret: newRelicClientSecret
			},
			options
		);
	}

	// perform custom refresh of a token per OAuth
	async customRefreshToken (providerInfo, options = {}) {
		const result = await this.refreshToken(providerInfo.refreshToken, providerInfo.provider, options);
		let expiresAt;
		if (result.expires_at) {
			expiresAt = result.expires_at * 1000;
		} else {
			expiresAt = Date.now() + 1000 * (result.expires_in || 3600);
		}
		const tokenData = {
			accessToken: result.id_token || result.access_token,
			tokenType: result.id_token ? 'id' : 'access',
			refreshToken: result.refresh_token,
			expiresAt
		};
		tokenData.provider = providerInfo.provider;
		return tokenData;
	}

	async _newrelic_idp_call (service, path, method = 'get', params = {}, options = {}) {
		if (options.mockResponse) {
			return this._getMockResponse(service, path, method, params, options);
		}

		const host = this.serviceHosts[service];
		if (!host) {
			this._throw('nrIDPInternal', `no host for service ${service}`, options);
		}

		let payloadSignature;
		if (service === 'user' || service === 'org' || service === 'credentials') {
			payloadSignature = await this._signPayload(params, options);
		}

		const haveParams = Object.keys(params).length > 0;
		let url = `${host}${path}`;
		let body;
		if (method === 'get' && haveParams) {
			url += '?' + Object.keys(params).map(key => {
				return `${key}=${encodeURIComponent(params[key])}`;
			}).join('&');
		} else if (haveParams) {
			body = params;
		}

		const fetchOptions = {
			method,
			headers: {
				...(options.headers || {}),
				'content-type': 'application/json'
			}
		};
		if (body) {
			fetchOptions.body = JSON.stringify(body);
		}
		if (payloadSignature) {
			fetchOptions.headers['NewRelic-Signed-Body'] = payloadSignature;
		}

		if (options.logger && options.verbose) {
			options.logger.log(`Calling New Relic: ${url}\n`, JSON.stringify(fetchOptions, 0, 5));
		}
		const response = await Fetch(url, fetchOptions);
		let json, text;
		try {
			if (response.status === 204) {
				json = {};
			} else if (response.status >= 300) {
				text = await response.text();
			} else {
				json = await response.json();
			}
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: ${message}`, options);
		}

		if (!response.ok) {
			const message = json ? JSON.stringify(json) : text;
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: response not ok (${response.status}): ${message}`, options);
		}

		if (options.logger && options.verbose) {
			options.logger.log('Response from New Relic:\n' + JSON.stringify(json, 0, 5));
		}
		return json;
	}

	_signPayload (data, options = {}) {
		const secret = this.apiConfig.integrations.newRelicIdentity.userServiceSecret;
		return Crypto.createHmac('sha256', secret)
			.update(JSON.stringify(data))
			.digest('hex');
	}

	_getMockResponse (service, path, method, params, options) {
		let response;
		if (service === 'signup') {
			if (path === '/internal/v1/signups/provision' && method === 'post') {
				return this._getMockSignupResponse();
			}
		} else if (service === 'user') {
			let match;
			if (path === '/v1/users' && method === 'post') {
				return this._getMockCreateUserResponse(params, options);
			} else if (method === 'get' && (match = path.match(/^\/v1\/users\/([0-9]+)$/))) {
				return this._getMockGetUserResponse(options.mockParams, match[1], options);
			} else if (method === 'get' && path === '/v1/users') {
				return this._getMockGetUsersResponse(options);
			} else if (method === 'get' && path === '/v1/groups') {
				return this._getMockGroupsResponse(options);
			}
		} else if (service === 'login') {
			if (path === `/idp/${NewRelicIDPConstants.NR_AZURE_PASSWORD_POLICY}/token` && method === 'post') {
				return this._getMockLoginResponse(params, options);
			} else if (path === '/api/v1/current_user/possible_authentication_domains.json' && method === 'get') {
				return this._getMockPossibleAuthDomainsResponse(options);
			} else if (path === '/api/v1/tokens' && method === 'post') {
				return this._getMockTokenExchangeResponse(options);
			} else if (path === '/api/v1/tokens/refresh' && method === 'post') {
				return this._getMockRefreshTokenResponse(params, options);
			}
		} else if (service === 'credentials') {
			let match;
			if (path === '/v1/pending_passwords' && method === 'post') {
				return this._getMockPendingPasswordResponse();
			} else if (match = path.match(/^\/v1\/pending_passwords\/.+\/apply\/([0-9]+)$/)) {
				return this._getMockPendingPasswordApplyResponse(match[1]);
			}
		} else if (service === 'org') {
			let match;
			if ((match = path.match(/^\/v0\/organizations\/(.+)\/authentication_domains$/)) && method === 'get') {
				return this._getMockAuthDomains(match[1]);
			} else if ((match = path.match(/^\/v0\/organizations\/(.+)$/)) && method === 'get') {
				return this._getMockOrgResponse(match[1]);
			} else if ((match = path.match(/^\/v0\/organizations\/(.+)$/)) && method === 'patch') {
				return this._getMockOrgPatchResponse(match[1]);
			}
		} else if (service === 'idp') {
			let match;
			if (match = path.match(/^\/azureb2c.*?\/users\/(.+)\/password$/) && method === 'post') {
				return this._getMockPasswordResponse();
			} else if (match = path.match(/^\/azureb2c.*?\/users\/(.+)\/set_codestream_idp_migration$/) && method === 'post') {
				return this._getMockSetIDPMigrationResponse();
			}
		}

		if (!response) {
			this._throw('nrIDPInternal', `no IdP mock response for ${service} ${method} ${path}`, options);
		}
	}

	_getMockSignupResponse () {
		return 	{
			organization_id: UUID(),
			customer_id: 'CC-' + this._getMockNRUserId(),
			customer_contract_id: UUID(),
			organization_group_id: UUID(),
			authentication_domain_id: UUID(),
			user_id: this._getMockNRUserId().toString(),
			account_id: this._getMockNRUserId()
		};
	}

	_getMockGetUserResponse (params = {}, id = null, options = {}) {
		id = id || this._getMockNRUserId().toString();
		const { 
			email,
			name,
			authenticationDomainId = UUID(),
			idpObjectId = UUID(),
			userTier = 'basic_user_tier'
		} = params;
		const now = Date.now();
		const data = {
			data: {
				id,
				type: 'user',
				attributes: {
					email,
					firstName: name,
					lastName: '',
					state: 'active',
					gravatarEmail: '',
					version: 2,
					name,
					timeZone: 'Etc/UTC',
					authenticationDomainId,
					activeIdp: NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY,
					activeIdpObjectId: idpObjectId,
					supportedIdps: [
						{
							name: NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY,
							idp_object_id: idpObjectId
						}
					],
					userTierId: 0,
					userTier,
					lastLogin: 0,
					lastActive: 0,
					createdAt: now,
					updatedAt: now
				}
				}
		};
		if (options.mockUser) {
			Object.assign(data.data.attributes, options.mockUser);
		}
		if (options.mockUserDeleted) {
			throw new Error(`couldn't find user`);
		}
		return data;
	}

	_getMockCreateUserResponse (params, options = {}) {
		const { email, name, authentication_domain_id } = params.data.attributes;
		return this._getMockGetUserResponse({
			email,
			name,
			authenticationDomainId: authentication_domain_id
		}, null, options);
		/*
		const now = Date.now();
		return {
			data: {
				id: Math.floor(Math.random() * 1000000000).toString(),
				type: 'user',
				attributes: {
					email: params.data.attributes.email,
					firstName: params.data.attributes.name,
					lastName: '',
					state: 'active',
					gravatarEmail: '',
					version: 2,
					name: params.data.attributes.name,
					timeZone: 'Etc/UTC',
					authenticationDomainId: params.data.attributes.authentication_domain_id,
					activeIdp: NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY,
					activeIdpObjectId: idpObjectId,
					supportedIdps: [
						{
							name: NewRelicIDPConstants.NR_AZURE_SIGNUP_POLICY,
							idp_object_id: idpObjectId
						}
					],
					userTierId: 1,
					userTier: 'basic_user_tier',
					lastLogin: 0,
					lastActive: 0,
					createdAt: now,
					updatedAt: now
				}
	   		}
		};
		*/
	}

	_getMockLoginResponse (params, options = {}) {
		const nrUserId = (
			options.mockNRUserId || 
			(options.request && options.request.request.headers['x-cs-mock-nr-user-id']) ||
			this._getMockNRUserId()
		);
		return {
			idp: {
				id_token: this._getMockNRIDToken(nrUserId),
				refresh_token: this._getMockNRRefreshToken(nrUserId, true),
				expires_in: Math.floor(Date.now() / 1000) + 3600
			}
		}
	}

	_getMockPendingPasswordResponse () {
		const now = Date.now();
		return {
			data: {
				id: UUID(),
				type: 'pendingPassword',
				attributes: {
					createdAt: now,
					updatedAt: now
				}
			}
		};
	}

	_getMockPendingPasswordApplyResponse (userId) {
		const now = Date.now();
		return {
			data: {
				id: UUID(),
				type: 'userPassword',
				attributes: {
					userId,
					createdAt: now,
					updatedAt: now
				}
			}
		};
	}

	_getMockOrgResponse (orgId) {
		const accountId = this._getMockNRUserId();
		return {
			data: {
				id: orgId,
				type: 'organization',
				attributes: {
					name: 'Organization ' + RandomString.generate(8),
					traits: [],
					reportingAccountId: accountId,
					accountCreationParentId: null,
					organizationGroupId: UUID(),
					customerContractId: UUID(),
					createdAt: Date.now() - 24 * 60 * 60 * 1000,
					deleteable: false,
					customer_id: 'CC-' + this._getMockNRUserId()
				},
				relationships: {
					accounts: {
						data: [
							{
								id: accountId.toString(),
								type: 'account'
							}
						]
					}
				}
			}
		}
	}

	_getMockOrgPatchResponse (orgId) {
		// for now, just return nothing
		return {};
	}

	_getMockAuthDomains (orgId) {
		return {
			data: [
				{
					id: UUID(),
					type: 'authenticationDomain',
					attributes: {
						authenticationType: 'password',
						currentSamlConfigurationId: null,
						currentScimConfigurationId: null,
						maxBrowserIdleDuration: 1209600,
						maxBrowserSessionDuration: 2592000,
						name: 'Default',
						organizationId: orgId,
						provisioningType: 'manual',
						basicFullTierChangeApproval: 'auto_approve',
						basicCoreTierChangeApproval: 'auto_approve',
						coreFullTierChangeApproval: 'auto_approve',
						idpManagedAttributes: [],
						upgradeMessage: null,
						upgradeButtonText: null,
						upgradeButtonTargetUrl: null,
						hasDefaultUpgradeSettings: true,
						requiresEmailVerification: true
					}
				}

			]
		};
	}

	_getMockPossibleAuthDomainsResponse (options = {}) {
		const loginServiceHost = this.serviceHosts.login;
		const authDomainId = UUID();
		const orgId = UUID();
		const userId = this._getMockNRUserId();
		const email = RandomString.generate(8) + '@' + RandomString.generate(8) + '.com';
		const loginUrl = `${loginServiceHost}/logout?no_re=true&return_to=${encodeURIComponent(loginServiceHost)}%2Flogin%3Fauthentication_domain_id%3D${authDomainId}%26email%3D${encodeURIComponent(email)}`;
		return {
			data: [{
				"authentication_domain_id": authDomainId,
				"authentication_domain_name": "Default",
				"authentication_type": "password",
				"organization_id": orgId,
				"organization_name": RandomString.generate(10),
				"login_url": loginUrl,
				"user_id": userId
			}]
		};
	}

	_getMockTokenExchangeResponse (options = {}) {
		let nrUserId, token, tokenKey, refreshToken, expires, expiresKey;
		if (options.mockUser) {
			nrUserId = options.mockUser.nr_userid;
			if (options.mockUser.wantIDToken) {
				token = this._getMockNRIDToken(nrUserId, options.mockUser);
				tokenKey = 'id_token';
				expires = 3600;
				expiresKey = 'expires_in';
			} else {
				token = this._getMockNRAccessToken(nrUserId, options.mockUser);
				tokenKey = 'access_token';
				expires = Math.floor(Date.now() / 1000) + 3600;
				expiresKey = 'expires_at';
			}
			refreshToken = this._getMockNRRefreshToken(nrUserId, options.mockUser.wantIDToken, options.mockUser);
		} else {
			nrUserId = this._getMockNRUserId();
			token = this._getMockNRAccessToken(nrUserId);
			refreshToken = this._getMockNRRefreshToken(nrUserId);
			expires = Math.floor(Date.now() / 1000) + 3600;
			expiresKey = 'expires_at';
		}
		return {
			[tokenKey]: token,
			refresh_token: refreshToken,
			[expiresKey]: expires
		};
	}

	_getMockGetUsersResponse (options = {}) {
		const mockUsers = [];
		(options.mockUsers || []).forEach(mockUser => {
			const params = Object.assign({}, mockUser);
			mockUser = this._getMockGetUserResponse(params, mockUser.nrUserId);
			mockUsers.push(mockUser);
		});
		return { data: mockUsers.map(mu => mu.data) };
	}

	_getMockRefreshTokenResponse (params = {}, options = {}) {
		if (!params.refresh_token) {
			throw new Error('no refreshToken given for mock refresh token response');
		}
		if (!params.refresh_token.match(/^MNRR(A|I)-/)) {
			throw new Error('not a valid mock refresh token');
		}
		const [tokenType, nrUserId, json] = params.refresh_token.split('-');
		const decoded = Buffer.from(json, 'base64').toString();
		const payload = JSON.parse(decoded);
		const idToken = tokenType === 'MNRRI';
		const tokenKey = idToken ? 'id_token' : 'access_token';
		const token = idToken ? this._getMockNRIDToken(nrUserId, payload) : this._getMockNRAccessToken(nrUserId, payload);
		const expiresKey = idToken ? 'expires_in' : 'expires_at';
		const expires = idToken ? 300 : Math.floor(Date.now() / 1000) + 300;
		return {
			[tokenKey]: token,
			provider: NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY,
			refresh_token: this._getMockNRRefreshToken(nrUserId, idToken, payload),
			[expiresKey]: expires
		};
	}

	_getMockPasswordResponse (options = {}) {
		return {};
	}

	_getMockSetIDPMigrationResponse (options = {}) {
		return {};
	}

	_getMockNRUserId () {
		return 1000000000 + Math.floor(Math.random() * 999999999);
	}

	_getMockNRIDToken (nrUserId, payload = {}) {
		return this._getMockNRToken(nrUserId, 'MNRI', payload);
	}

	_getMockNRAccessToken (nrUserId, payload = {}) {
		return this._getMockNRToken(nrUserId, 'MNRA', payload);
	}

	_getMockNRRefreshToken (nrUserId, idToken = false, payload = {}) {
		const type = idToken ? 'MNRRI' : 'MNRRA';
		return this._getMockNRToken(nrUserId, type, payload);
	}

	_getMockNRToken (nrUserId, type, payload = {}) {
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
		return `${type}-${nrUserId}-${encoded}-${RandomString.generate(100)}`;
	}

	_throw (type, message, options = {}) {
		if (options.request) {
			throw options.request.errorHandler.error(type, { message });
		} else {
			throw new Error(message);
		}
	}
}

module.exports = NewRelicIDP;
