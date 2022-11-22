// handle interactions with New Reclic's Identity Provider service

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const Fetch = require('node-fetch');
const Crypto = require('crypto');
const UUID = require('uuid').v4;

// FIXME: this is for now ... ultimately, these should come from config
const SERVICE_HOSTS = {
	'signup': 'https://signup-processor.staging-service.newrelic.com',
	'user': 'https://staging-user-service.nr-ops.net',
	'login': 'https://staging-login.newrelic.com',
	'credentials': 'https://staging-credential-service.nr-ops.net'
};

const PATH_TO_LOGIN = '/idp/azureb2c-cs/redirect?return_to={wherever you want them to go to}';
const TEMP = 'https://staging-login.newrelic.com/idp/azureb2c-cs/redirect?return_to=https%3A%2F%2Flocalhost.codestream.us%3A12079%2Fno-auth%2Fprovider-token%2Fnewrelic-idp';

const USER_SERVICE_SECRET = process.env.NEWRELIC_USER_SERVICE_SECRET; // for now, ultimately, this needs to come from config

class NewRelicIDP extends APIServerModule {

	services () {
		// return a function that, when invoked, returns a service structure with the interface to New Relic IDP
		// as the IDP service
		return async () => {
			return { idp: this };
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
		const signupResponse = await this.signupUser(data, options);
		/*
		const loginResponse = await this.loginUser(
			{
				username: data.email,
				password: data.password
			},
			options
		);
		*/
		return {
			...signupResponse,
			//token: loginResponse.value
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
		return this._newrelic_idp_call(
			'user',
			'/v1/users',
			'get',
			{ 
				authentication_domain_id: domainId
			},
			options
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

	async _newrelic_idp_call (service, path, method = 'get', params = {}, options = {}) {
		if (options.mockResponse) {
			return this._getMockResponse(service, path, method, params, options);
		}

		const host = this.serviceHosts[service];
		if (!host) {
			this._throw('nrIDPInternal', `no host for service ${service}`, options);
		}

		let payloadSignature;
		if (service === 'user' || service === 'credentials') {
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

		const response = await Fetch(url, fetchOptions);

		let json;
		try {
			if (path.match(/token/)) {
				const text = await response.text();
			}
			json = await response.json();
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: ${message}`, options);
		}

		if (!response.ok) {
			const message = json ? JSON.stringify(json) : '???';
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: response not ok (${response.status}): ${message}`, options);
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
			if (path === '/v1/users' && method === 'post') {
				return this._getMockCreateUserResponse(params);
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
			authenticatin_domain_id: UUID(),
			user_id: Math.floor(Math.random() * 1000000000).toString(),
			account_id: Math.floor(Math.random() * 100000000)
		};
	}

	_getMockCreateUserResponse (params) {
		const idpObjectId = UUID();
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
					authenticationDomainId: params.data.attributes.authenticatin_domain_id,
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

	_throw (type, message, options = {}) {
		if (options.request) {
			throw options.request.errorHandler.error(type, { message });
		} else {
			throw new Error(message);
		}
	}
}

module.exports = NewRelicIDP;
