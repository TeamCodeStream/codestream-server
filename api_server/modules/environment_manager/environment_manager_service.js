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
		const result = await Promise.all(hosts.map(async host => {
			const user = await this.fetchUserFromEnvironmentHost(host, email);
			return user && { host, user };
		}));
		return result.filter(_ => _);
	}

	// fetch the user matching the given email (if any) from the given environment host
	async fetchUserFromEnvironmentHost (host, email) {
		const url = `${host.host}/xenv/fetch-user?email=${encodeURIComponent(email)}`;
		this.api.log(`Fetching user ${email} in environment ${host.name}:${host.host}...`);
		const response = await this._fetchFromUrl(url);
		if (response.user) {
			this.api.log(`Did fetch user ${response.user.id}:${response.user.email} from environment ${host.name}:${host.host}`);
		} else {
			this.api.log(`Did not find user matching ${email} in environment ${host.name}:${host.host}`);
		}
		return response.user;
	}

	// confirm a user who has been invited across environments
	// returns the user records for all confirmed users, along with the environment they
	// were confirmed in
	async confirmInAllEnvironments (user) {
		const hosts = this.getForeignEnvironmentHosts();
		let result = await Promise.all(hosts.map(async host => {
			return await this.confirmUserInEnvironment(host, user);
		}));
		result = result.filter(_ => _);
		return result;
	}
	
	// confirm a user who has been invited in the passed environment
	// returns the user record if the user existed in that environment,
	// along with the environment they were confirmed in
	async confirmUserInEnvironment (host, user) {
		const url = `${host.host}/xenv/confirm-user`;
		this.api.log(`Cross-confirming user ${user.get('email')} in environment ${host.name}:${host.host}...`);
		const body = {
			email: user.get('email'),
			username: user.get('username'),
			passwordHash: user.get('passwordHash')
		};
		const response = await this._fetchFromUrl(url, { method: 'post', body });
		if (response && response.user) {
			this.api.log(`Did cross-confirm user ${response.user.id}:${response.user.email} in environment ${host.name}:${host.host}`);
			return { user: response.user, host };
		} else {
			this.api.log(`User ${user.get('email')} not found in environment ${host.name}:${host.host}`);
		}
	}

	// fetch all companies across all foreign environments that have domain joining on for the given domain
	async fetchEligibleJoinCompaniesFromAllEnvironments (domain) {
		const hosts = this.getForeignEnvironmentHosts();
		const companies = [];
		await Promise.all(hosts.map(async host => {
			const companiesFromEnvironment = await this.fetchEligibleJoinCompaniesFromEnvironment(host, domain);
			companies.push.apply(companies, companiesFromEnvironment);
		}));
		return companies;
	}

	// fetch all companies from the given environment host that have domain joining on for the given domain
	async fetchEligibleJoinCompaniesFromEnvironment (host, domain) {
		const url = `${host.host}/xenv/eligible-join-companies?domain=${encodeURIComponent(domain)}`;
		this.api.log(`Fetching eligible join companies matching domain ${domain} from environment ${host.name}:${host.host}...`);
		const response = await this._fetchFromUrl(url);
		if (response && response.companies) {
			this.api.log(`Did fetch ${response.companies.length} eligible join companies matching domain ${domain} from environment ${host.name}:${host.host}`);
			return response.companies.map(company => {
				return { company, host };
			});
		} else {
			this.api.log(`Did not fetch any eligible join companies matching domain ${domain} from environment ${host.name}:${host.host}`);
			return [];
		}
	}
	
	// fetch all companies across all foreign environments that a given user (by email) is a member of
	async fetchUserCompaniesFromAllEnvironments (email) {
		const hosts = this.getForeignEnvironmentHosts();
		const companies = [];
		await Promise.all(hosts.map(async host => {
			const companiesFromEnvironment = await this.fetchUserCompaniesFromEnvironment(host, email);
			companies.push.apply(companies, companiesFromEnvironment);
		}));
		return companies;
	}

	// fetch all companies from the given environment host that a given user (by email) is a member of
	async fetchUserCompaniesFromEnvironment (host, email) {
		const url = `${host.host}/xenv/user-companies?email=${encodeURIComponent(email)}`;
		this.api.log(`Fetching companies user ${email} is a member of from environment ${host.name}:${host.host}...`);
		const response = await this._fetchFromUrl(url);
		if (response && response.companies) {
			this.api.log(`Did fetch ${response.companies.length} companies user ${email} is a member of from environment ${host.name}:${host.host}`);
			return response.companies.map(company => {
				return { company, host };
			});
		} else {
			this.api.log(`Did not fetch any companies user ${email} is a member of from environment ${host.name}:${host.host}`);
			return [];
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