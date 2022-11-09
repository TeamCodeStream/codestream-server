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
		const { runTimeEnvironment } = this.api.config.sharedGeneral;
		const { environmentGroup } = this.api.config;
		let keys = Object.keys(environmentGroup || {}) || [];
		return keys.reduce((hosts, key) => {
			if (key !== runTimeEnvironment) {
				hosts.push({ ...environmentGroup[key] });
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
		const url = `${host.publicApiUrl}/xenv/fetch-user?email=${encodeURIComponent(email)}`;
		this.api.log(`Fetching user ${email} in environment ${host.name}:${host.publicApiUrl}...`);
		const response = await this.fetchFromUrl(url);
		if (response.user) {
			this.api.log(`Did fetch user ${response.user.id}:${response.user.email} from environment ${host.name}:${host.publicApiUrl}`);
		} else {
			this.api.log(`Did not find user matching ${email} in environment ${host.name}:${host.publicApiUrl}`);
		}
		return response.user;
	}

	// fetch the user matching an ID from a specific environment host
	async fetchUserFromHostById (host, id) {
		const url = `${host}/xenv/fetch-user?id=${id}`;
		this.api.log(`Fetching user ${id} from server ${host}...`);
		const response = await this.fetchFromUrl(url);
		if (response && response.user) {
			this.api.log(`Did fetch user ${response.user.id}:${response.user.email} from server ${host}`);
			return response.user;
		} else {
			this.api.log(`Did not find user with ID ${id} in fetch from server ${host}`);
			return;
		}
	}

	// ensure the user matching the given user data (matched by email) exists on the given environment host,
	// fetching it if it exists, or creating it if it doesn't
	async ensureUserOnEnvironmentHost (host, user) {
		const url = `${host}/xenv/ensure-user`;
		const body = { user };
		this.api.log(`Ensuring user ${user.email} exists on environment ${host}...`);
		const response = await this.fetchFromUrl(url, { method: 'post', body });
		if (response.user) {
			this.api.log(`Did ensure and fetch user ${response.user.id}:${response.user.email} from environment ${host}`);
		} else {
			this.api.log(`Did not ensure user matching ${user.email} in environment ${host}`);
		}
		return response;
	}

	// delete the user matching an ID from a specific environment host
	async deleteUserFromHostById (host, id) {
		const url = `${host}/xenv/delete-user/${id}`;
		this.api.log(`Deleting user ${id} from server ${host}...`);
		const response = await this.fetchFromUrl(url, { method: 'delete' });
		if (response) {
			this.api.log(`Did delete user ${id} from server ${host}`);
		} else {
			this.api.log(`Did not delete user with ID ${id} in fetch from server ${host}`);
		}
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
		const url = `${host.publicApiUrl}/xenv/confirm-user`;
		this.api.log(`Cross-confirming user ${user.get('email')} in environment ${host.name}:${host.publicApiUrl}...`);
		const body = {
			email: user.get('email'),
			username: user.get('username'),
			passwordHash: user.get('passwordHash')
		};
		const response = await this.fetchFromUrl(url, { method: 'post', body });
		if (response && response.user) {
			this.api.log(`Did cross-confirm user ${response.user.id}:${response.user.email} in environment ${host.name}:${host.publicApiUrl}`);
			return { response, host };
		} else {
			this.api.log(`User ${user.get('email')} not found in environment ${host.name}:${host.publicApiUrl}`);
		}
	}

	// change a user's email in all environments
	async changeEmailInAllEnvironments (email, toEmail) {
		const hosts = this.getForeignEnvironmentHosts();
		return Promise.all(hosts.map(async host => {
			return await this.changeEmailInEnvironment(host, email, toEmail);
		}));
	}
	
	// change a user's email in the passed environment
	async changeEmailInEnvironment (host, email, toEmail) {
		const url = `${host.publicApiUrl}/xenv/change-email`;
		this.api.log(`Changing email for user ${email} to ${toEmail} in environment ${host.name}:${host.publicApiUrl}...`);
		const body = { email, toEmail };
		return this.fetchFromUrl(url, { method: 'put', body });
	}

	// fetch all companies across all foreign environments that have domain joining on for the given domain
	async fetchEligibleJoinCompaniesFromAllEnvironments (emailOrDomain) { // becomes just email under ONE_USER_PER_ORG
		const hosts = this.getForeignEnvironmentHosts();
		const companies = [];
		await Promise.all(hosts.map(async host => {
			const companiesFromEnvironment = await this.fetchEligibleJoinCompaniesFromEnvironment(host, emailOrDomain); // becomes just email under ONE_USER_PER_ORG
			companies.push.apply(companies, companiesFromEnvironment);
		}));
		return companies;
	}

	// fetch all companies from the given environment host that have domain joining on for the given domain
	async fetchEligibleJoinCompaniesFromEnvironment (host, emailOrDomain) {  // becomes just email under ONE_USER_PER_ORG
		let url;
		if (emailOrDomain.match(/@/)) { // remove this check when we fully move to ONE_USER_PER_ORG, make it just an email
			url = `${host.publicApiUrl}/xenv/eligible-join-companies?email=${encodeURIComponent(emailOrDomain)}`;
			this.api.log(`Fetching eligible join companies matching email ${emailOrDomain} from environment ${host.name}:${host.publicApiUrl}...`);
		} else {
			url = `${host.publicApiUrl}/xenv/eligible-join-companies?domain=${encodeURIComponent(emailOrDomain)}`;
			this.api.log(`Fetching eligible join companies matching domain ${emailOrDomain} from environment ${host.name}:${host.publicApiUrl}...`);
		}	 
		const response = await this.fetchFromUrl(url);
		if (response && response.companies) {
			this.api.log(`Did fetch ${response.companies.length} eligible join companies matching email/domain ${emailOrDomain} from environment ${host.name}:${host.publicApiUrl}`);
			return response.companies.map(company => {
				return { company, host };
			});
		} else {
			this.api.log(`Did not fetch any eligible join companies matching email/domain ${emailOrDomain} from environment ${host.name}:${host.publicApiUrl}`);
			return [];
		}
	}
	
	// fetch all companies across all foreign environments that a given user (by email) is a member of
	// deprecate this when we have fully moved to ONE_USER_PER_ORG
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
		const url = `${host.publicApiUrl}/xenv/user-companies?email=${encodeURIComponent(email)}`;
		this.api.log(`Fetching companies user ${email} is a member of from environment ${host.name}:${host.publicApiUrl}...`);
		const response = await this.fetchFromUrl(url);
		if (response && response.companies) {
			this.api.log(`Did fetch ${response.companies.length} companies user ${email} is a member of from environment ${host.name}:${host.publicApiUrl}`);
			return response.companies.map(company => {
				return { company, host };
			});
		} else {
			this.api.log(`Did not fetch any companies user ${email} is a member of from environment ${host.name}:${host.publicApiUrl}`);
			return [];
		}
	}
	
	// publish eligible join companies for an email across environments
	async publishEligibleJoinCompaniesInEnvironments (email) {
		const hosts = this.getForeignEnvironmentHosts();
		await Promise.all(hosts.map(async host => {
			return await this.publishEligibleJoinCompaniesInEnvironment(host, email);
		}));
	}
	
	// publish eligible join companies for an email in the passed environment
	async publishEligibleJoinCompaniesInEnvironment (host, email) {
		const url = `${host.publicApiUrl}/xenv/publish-ejc`;
		this.api.log(`Publishing eligible join companies for ${email} in environment ${host.name}:${host.publicApiUrl}...`);
		const body = { email };
		return this.fetchFromUrl(url, { method: 'post', body });
	}

	// fetch from the environment host, given a url
	async fetchFromUrl (url, options = {}) {
		let response;
		options.headers = options.headers || {};
		options.headers['x-cs-auth-secret'] = this.api.config.environmentGroupSecrets.requestAuth;
		options.headers['x-cs-override-maintenance-mode'] = 'xyz123';
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