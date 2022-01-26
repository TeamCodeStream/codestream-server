// provides the environment manager service to manage concerns related to different environments 

'use strict';

const Fetch = require('node-fetch');

class EnvironmentManagerService {

	constructor (options) {
		Object.assign(this, options);
		if (!this.api) {
			throw 'api object required for environment manager service';
		}
	}

	// get all environment hosts except the current one
	getForeignEnvironmentHosts () {
		const { environmentHosts, runTimeEnvironment } = this.api.config.sharedGeneral;
		let keys = Object.keys(environmentHosts || {}) || [];
		return keys.reduce((hosts, key) => {
			const { name, host } = environmentHosts[key];
			if (key !== runTimeEnvironment) {
				hosts.push({ key, name, host });
			}
			return hosts;
		}, []);
	}

	// check each environment host (except this one) for a user matching the given email
	async searchEnvironmentHostsForUser (email) {
		const hosts = this.getForeignEnvironmentHosts();
		return await Promise.all(hosts.map(async host => {
			const user = await this.fetchUserFromEnvironmentHost(host, email);
			return user && { host, user };
		}));
	}

	// fetch the user matching the given email (if any) from the given environment host
	async fetchUserFromEnvironmentHost (host, email) {
		const url = `${host.host}/xenv/fetch-user?email=${encodeURIComponent(email)}`;
		return this._fetchFromUrl(url);
	}

	// confirm a user who has been invited across environments
	// returns the user records for all confirmed users, along with the environment they
	// were confirmed in
	async confirmInAllEnvironments (email) {
		const hosts = this.getForeignEnvironmentHosts();
		let result = await Promise.all(hosts.map(async host => {
			return await this.confirmUserInEnvironment(host, email);
		}));
		result = result.filter(_ => _);
		return result;
	}
	
	// confirm a user who has been invited in the passed environment
	// returns the user record if the user existed in that environment,
	// along with the environment they were confirmed in
	async confirmUserInEnvironment (host, email) {
		const url = `${host.host}/xenv/confirm-user`;
		this.api.log(`Cross-confirming user ${email} in environment ${host.name}:${host.host}...`);
		const response = await this._fetchFromUrl(url, { method: 'post', body: { email } });
		if (response && response.user) {
			this.api.log(`Did cross-confirm user ${response.user.id}:${response.user.email} in environment ${host.name}:${host.host}`);
			return { user: response.user, host };
		} else {
			this.api.log(`User ${email} not found in environment ${host.name}:${host.host}`);
		}
	}

	// fetch from the environment host, given a url
	async _fetchFromUrl (url, options = {}) {
		let response;
		options.headers = options.headers || {};
		options.headers['x-cs-auth-secret'] = this.api.config.sharedSecrets.auth;
		if (options.body) {
			options.headers['content-type'] = 'application/json';
			options.body = JSON.stringify(options.body);
		}
		try {
			response = await Fetch(url, options);
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.api.warn(`Caught exception fetching (${url}) from foreign environment host: ${message}`);
			return;
		}
		if (response.status !== 200) {
			let errorBody;
			try {
				errorBody = await response.json();
			} catch (error) { }
			this.api.warn(`Request to foreign environment host (${url}) failed, status code ${response.status}: ${JSON.stringify(errorBody)}`);
			return;
		}
		return response.json();
	}
}

module.exports = EnvironmentManagerService;