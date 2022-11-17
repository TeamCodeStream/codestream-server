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
			}
		);

		// now apply the "pending password" to the user
		await this._newrelic_idp_call(
			'credentials',
			`/v1/pending_passwords/${pendingPasswordResponse.data.id}/apply/${createUserResponse.data.id}`,
			'post',
			{
				timestamp: Date.now(),
				request_id: UUID()
			}
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
			body
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
			{ },
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

	async _newrelic_idp_call (service, path, method = 'get', params = {}, options = {}) {
		const host = this.serviceHosts[service];
		if (!host) {
			this._throw('nrIDPInternal', `no host for service ${service}`, options);
		}

		let payloadSignature;
		if (service === 'user' || service === 'credentials') {
			payloadSignature = await this._signPayload(params, options);
		}

		let url = `${host}${path}`;
		let body;
		if (method === 'get' && Object.keys(params).length > 0) {
			url += '?' + Object.keys(params).map(key => {
				return `${key}=${encodeURIComponent(params[key])}`;
			}).join('&');
		} else {
			body = params;
		}

		const fetchOptions = {
			method,
			body: JSON.stringify(body),
			headers: {
				'Content-Type': 'application/json'
			}
		};

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

	_throw (type, message, options = {}) {
		if (options.request) {
			throw options.request.errorHandler.error(type, { message });
		} else {
			throw new Error(message);
		}
	}
}

module.exports = NewRelicIDP;
