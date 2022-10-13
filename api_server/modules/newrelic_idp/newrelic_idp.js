// handle interactions with New Reclic's Identity Provider service

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module');
const Fetch = require('node-fetch');
const Crypto = require('crypto');

// FIXME: this is for now ... ultimately, these should come from config
const SERVICE_HOSTS = {
	'signup': 'https://signup-processor.staging-service.newrelic.com',
	'user': 'https://staging-user-service.nr-ops.net',
};

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

	async createUser (data, options = {}) {
		data = {
			data: {
				type: 'user',
				attributes: {
					authentication_domain_id: "36bdeb68-b5a9-4b47-a1a7-90999c7f2d30", // what should this be, really???
					email: data.email,
					username: data.username,
					name: data.name
				}
			}
		}
		const resp = await this._newrelic_idp_call(
			'user',
			'/v1/users',
			'post',
			data
		);
		return resp;
	}

	async signupUser (data, options = {}) {
		const resp = await this._newrelic_idp_call(
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
		return resp;
	}

	async _newrelic_idp_call (service, path, method = 'get', params = {}, options = {}) {
		const host = this.serviceHosts[service];
		if (!host) {
			this._throw('nrIDPInternal', `no host for service ${service}`, options);
		}

		let payloadSignature;
		if (service === 'user') {
			payloadSignature = await this._signPayload(params, options);
		}

		let url = `${host}${path}`;
		let body;
		if (method === 'get') {
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
			json = await response.json();
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this._throw('apiFailed', `${method.toUpperCase()} ${path}: ${message}`, options);
		}

		if (!response.ok) {
			const message = json.error || '???';
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
