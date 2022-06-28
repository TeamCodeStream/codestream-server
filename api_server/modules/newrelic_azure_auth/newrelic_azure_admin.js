// provide a class to handle administrative functions for NewRelic Azure users

'use strict';

const Fetch = require('node-fetch');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');

const PROPS_MAP = {
	fullName: 'displayName'
};

const GRAPH_URL = 'https://graph.microsoft.com/v1.0';

class NewRelicAzureAdmin {

	constructor (options) {
		Object.assign(this, options);
	}

	// return the provider associated with this admin service
	getProviderName () {
		return 'newrelic_azure';
	}

	// fetch an access token to use for other operations
	async fetchAccessToken (options) {
		const {
			tenant,
			adminAppClientId,
			adminAppClientSecret
		} = this.api.config.integrations.newrelic_azure;

		//const form = new FormData();
		const parameters = {
			client_id: adminAppClientId,
			client_secret: adminAppClientSecret,
			scope: 'https://graph.microsoft.com/.default',
			grant_type: 'client_credentials'
		};

		const formData = Object.keys(parameters).map(key => {
			return `${key}=${encodeURIComponent(parameters[key])}`;
		}).join('&');

		const url = `https://login.microsoftonline.com/${tenant}.onmicrosoft.com/oauth2/v2.0/token`;
		const response = await Fetch(url, {
			method: 'POST',
			body: formData,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			}
		});

		if (!response.ok) {
			const json = await response.json();
			const error = `Bad response from Azure fetching access token for user admin (${response.status}): ${JSON.stringify(json)}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason: error });
		}

		this.tokenData = await response.json();

		// assume access token expires one minute before it really does
		this.tokenData.expiresAt = Date.now() + (this.tokenData.expires_in - 60) * 1000;
	}

	// get an access token to use for Azure operations, through cache, or fetched
	async getAccessToken (options) {
		options.request.errorHandler.add(UserErrors);
		if (!this.tokenData || this.tokenData.expiresAt <= Date.now()) {
			await this.fetchAccessToken(options);
		}
		return this.tokenData.access_token;
	}

	// get a user's properties
	async getUser (userId, options) {
		const token = await this.getAccessToken(options);
		const url = `${GRAPH_URL}/users/${userId}`;
		let response;
		try {
			response = await Fetch(url, {
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const reason = `Unexpected error from Azure trying to fetch user ${userId}: ${message}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason });
		}
	
		if (!response.ok) {
			const json = await response.json();
			const error = `Bad response from Azure trying to fetch user ${userId} (${response.status}): ${JSON.stringify(json)}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason: error });
		}
		return response.json();
	}

	// update a user in the Azure tenant
	async updateUser (userId, props, options) {
		const token = await this.getAccessToken(options);

		const azureProps = {};
		Object.keys(props).forEach(prop => {
			const azureProp = PROPS_MAP[prop];
			if (azureProp) {
				azureProps[azureProp] = props[prop];
			}
		});
		if (Object.keys(azureProps).length === 0) {
			return;
		}

		const url = `${GRAPH_URL}/users/${userId}`;
		let response;
		try {
			response = await Fetch(url, {
				method: 'PATCH',
				body: JSON.stringify(azureProps),
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const reason = `Unexpected error from Azure trying to update user ${userId}: ${message}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason });
		}

		if (!response.ok) {
			const json = await response.json();
			const error = `Bad response from Azure trying to update user ${userId} (${response.status}): ${JSON.stringify(json)}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason: error });
		}

		return true;
	}

	// delete a user from the Azure tenant
	async deleteUser (userId, options) {
		const token = await this.getAccessToken(options);

		const url = `${GRAPH_URL}/users/${userId}`;
		let response;
		try {
			response = await Fetch(url, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const reason = `Unexpected error from Azure trying to delete user ${userId}: ${message}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason });
		}

		if (!response.ok) {
			const json = await response.json();
			const error = `Bad response from Azure trying to delete user ${userId} (${response.status}): ${JSON.stringify(json)}`;
			throw options.request.errorHandler.error('userAdminOpFailed', { reason: error });
		}
	}
}

module.exports = NewRelicAzureAdmin;