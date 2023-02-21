// handle interactions with New Reclic's Identity Provider service

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const Fetch = require('node-fetch');
const Crypto = require('crypto');
const UUID = require('uuid').v4;
const NewRelicAuthorizer = require('./new_relic_authorizer');
const RandomString = require('randomstring');

// FIXME: this is for now ... ultimately, these should come from config
const SERVICE_HOSTS = {
	'signup': 'https://signup-processor.staging-service.newrelic.com',
	'user': 'https://staging-user-service.nr-ops.net',
	'login': 'https://staging-login.newrelic.com',
	'credentials': 'https://staging-credential-service.nr-ops.net',
	'org': 'https://staging-organization-service.nr-ops.net',
	'graphql': 'https://nerd-graph.staging-service.nr-ops.net'
};
const SET_COOKIE = 'login_service_staging-login_newrelic_com_oidctokens';
const PATH_TO_LOGIN = '/idp/azureb2c-cs/redirect?return_to={wherever you want them to go to}';
const TEMP = 'https://staging-login.newrelic.com/idp/azureb2c-cs/redirect?return_to=https%3A%2F%2Flocalhost.codestream.us%3A12079%2Fno-auth%2Fprovider-token%2Fnewrelic-idp';

const USER_SERVICE_SECRET = process.env.NEWRELIC_USER_SERVICE_SECRET; // for now, ultimately, this needs to come from config

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

	async initialize () {
		// FIXME: this is for now ... ultimately, these should come from config
		this.serviceHosts = SERVICE_HOSTS;
	}

	async createUserWithPassword (attributes, password, options = {}) {
		// first create the actual user
		const createUserResponse = await this.createUser(attributes, options);

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

		return createUserResponse.data;
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
		if (options.mockResponse) {
			options.mockParams = {
				email: data.email,
				name: data.name,
				userTier: 'full_user_tier'
			};
		}

		const signupResponse = await this.signupUser({
			name: data.name,
			email: data.email,
			password: data.password
		}, options);
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

		// the below may not be necessary if the loginResponse, above, returns us the info
		// we want
		const userInfo = await this.getUser(signupResponse.user_id, options);

		return {
			signupResponse,
			nrUserInfo: userInfo.data,
			token: encodeURIComponent(loginResponse.newrelic.value),
			setCookie: SET_COOKIE
		};
	}

	async signupUser (data, options = {}) {
		return this._newrelic_idp_call(
			'signup',
			'/internal/v1/signups/provision',
			'post',
			{ 
				user: data,
				account: {
					region: "us01" // TODO: NEW_RELIC_IDP: deal with EU here???
				}
			},
			options
		);
	}

	async loginUser (data, options = {}) {
		return this._newrelic_idp_call(
			'login',
			'/idp/azureb2c-csropc/token',
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

	async updateUser (id, data, options = {}) {
		const user = await this.getUser(id);
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
		// use the NewRelicAuthorizer, which makes a graphql call to delete the user
		await new NewRelicAuthorizer({
			graphQLHost: SERVICE_HOSTS['graphql'],
			request: options.request,
			teamId: codestreamTeamId // used to get the user's API key, to make a nerdgraph request
		}).deleteUser(id, options);
	}

	// determine whether an NR org qualifies as "codestream only"
	// currently, we need to examine whether it has the unlimited_consumption entitlement
	async isNROrgCodeStreamOnly (nrOrgId, codestreamTeamId, options = {}) {
		/*
		// until we can get a valid token back from the signup or login process, we don't have a way to
		// make the entitlements API call, so return true for now until that blocker is fixed
		return true;
		*/
		
		// before determining if the org has the unlimited_consumption entitlement,
		// we need to get its reporting account
		const accountId = await this.getOrgReportingAccount(nrOrgId, options);
		if (!accountId) {
			this._throw('nrIDPInternal', `could not get reporting account for NR Org ID ${nrOrgId}`, options);
		}

		// use the NewRelicAuthorizer, which makes a graphql call to get the entitlements
		// for this account ... if it DOES NOT have the entitlement, it can still be codestream-only
		const hasEntitlement = await new NewRelicAuthorizer({
			graphQLHost: SERVICE_HOSTS['graphql'],
			request: options.request,
			teamId: codestreamTeamId // used to get the user's API key, to make a nerdgraph request
		}).nrOrgHasUnlimitedConsumptionEntitlement(accountId, options);
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
	// get the "reporting account" for the given NR org ID
	async getOrgReportingAccount (nrOrgId, options) {
		const result = await this._newrelic_idp_call(
			'org',
			'/v0/organizations/' + nrOrgId,
			'get',
			undefined,
			options
		);

		return (
			result.data &&
			result.data.attributes &&
			result.data.attributes.reportingAccountId
		);
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

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const host = SERVICE_HOSTS['login']; // FIXME: should come from config
		const url = `${host}/idp/azureb2c-cs/redirect`;
		return { 
			url,
			parameters: {
				return_to: options.redirectUri
			}
		};
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
				'Content-Type': 'application/json'
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

		let json;
		try {
			if (path.match(/token/)) {
				const text = await response.text();
//console.warn('text:', text);
				try {
					json = JSON.parse(text);
				} catch (e) {
					console.warn('UNABLE TO PARSE:', e);
					throw e;
				}
			} else {
				json = await response.json();
			}
//console.warn('json:', JSON.stringify(json, 0, 5));
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: ${message}`, options);
		}

		if (!response.ok) {
			const message = json ? JSON.stringify(json) : '???';
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: response not ok (${response.status}): ${message}`, options);
		}

		if (options.logger && options.verbose) {
			options.logger.log('Response from New Relic:\n' + JSON.stringify(json, 0, 5));
		}
		return json;
	}

	_signPayload (data, options = {}) {
		return Crypto.createHmac('sha256', USER_SERVICE_SECRET)
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
				return this._getMockCreateUserResponse(params);
			} else if (method === 'get' && (match = path.match(/^\/v1\/users\/([0-9]+)$/))) {
				return this._getMockGetUserResponse(options.mockParams, match[1]);
			}
		} else if (service === 'login') {
			if (path === '/idp/azureb2c-csropc/token' && method === 'post') {
				return this._getMockLoginResponse(params);
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
			if ((match = path.match(/^\/v0\/organizations\/(.+)$/)) && method === 'get') {
				return this._getMockOrgResponse(match[1]);
			} else if ((match = path.match(/^\/v0\/organizations\/(.+)$/)) && method === 'patch') {
				return this._getMockOrgPatchResponse(match[1]);
			}
		}
		 
		if (!response) {
			this._throw('nrIDPInternal', `no IdP mock response for ${service} ${method} ${path}`, options);
		}
	}

	_getMockSignupResponse () {
		return 	{
			organization_id: UUID(),
			customer_id: 'CC-' + Math.floor(Math.random() * 1000000000),
			customer_contract_id: UUID(),
			organization_group_id: UUID(),
			authentication_domain_id: UUID(),
			user_id: Math.floor(Math.random() * 1000000000).toString(),
			account_id: Math.floor(Math.random() * 100000000)
		};
	}

	_getMockGetUserResponse (params = {}, id = null) {
		id = id || Math.floor(Math.random() * 1000000000).toString();
		const { 
			email,
			name,
			authenticationDomainId = UUID(),
			idpObjectId = UUID(),
			userTier = 'basic_user_tier'
		} = params;
		const now = Date.now();
		return {
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
					activeIdp: 'azureb2c',
					activeIdpObjectId: idpObjectId,
					supportedIdps: [
						{
							name: 'azureb2c',
							idp_object_id: idpObjectId
						}
					],
					userTierId: 1,
					userTier,
					lastLogin: 0,
					lastActive: 0,
					createdAt: now,
					updatedAt: now
				}
	   		}
		};
	}

	_getMockCreateUserResponse (params) {
		const { email, name, authentication_domain_id } = params.data.attributes;
		return this._getMockGetUserResponse({
			email,
			name,
			authenticationDomainId: authentication_domain_id
		});
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
					activeIdp: 'azureb2c',
					activeIdpObjectId: idpObjectId,
					supportedIdps: [
						{
							name: 'azureb2c',
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

	_getMockLoginResponse (params) {
		// TODO
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
		const accountId = Math.floor(Math.random() * 100000000);
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
					customer_id: 'CC-' + Math.floor(Math.random() * 1000000000)
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

	_throw (type, message, options = {}) {
		if (options.request) {
			throw options.request.errorHandler.error(type, { message });
		} else {
			throw new Error(message);
		}
	}
}

module.exports = NewRelicIDP;
