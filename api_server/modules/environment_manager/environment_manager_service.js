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
			const { name, host } = environMentHosts[key];
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
		const url = `${host.host}/no-auth/__fetch-user__?email=${encodeURIComponent(email)}`;
		return this._fetchFromUrl(url);
	}

	// fetch from the environment host, given a url
	async _fetchFromUrl (url) {
		let response;
		try {
			response = await Fetch(url);
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