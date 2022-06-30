// provide a class to handle administrative functions for NewRelic Azure users

'use strict';

const Fetch = require('node-fetch');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');

const PROPS_MAP = {
	fullName: 'displayName',
	email: 'mail',
};

const GRAPH_URL = 'https://graph.microsoft.com/v1.0';

class NewRelicAzureAdmin {
	constructor(options) {
		Object.assign(this, options);
	}

	// return the provider associated with this admin service
	getProviderName() {
		return 'newrelic_azure';
	}

	// fetch an access token to use for other operations
	async fetchAccessToken(options) {
		const { tenant, adminAppClientId, adminAppClientSecret } =
			this.config.integrations.newrelic_azure;

		//const form = new FormData();
		const parameters = {
			client_id: adminAppClientId,
			client_secret: adminAppClientSecret,
			scope: 'https://graph.microsoft.com/.default',
			grant_type: 'client_credentials',
		};

		const formData = Object.keys(parameters)
			.map((key) => {
				return `${key}=${encodeURIComponent(parameters[key])}`;
			})
			.join('&');

		const url = `https://login.microsoftonline.com/${tenant}.onmicrosoft.com/oauth2/v2.0/token`;
		const response = await Fetch(url, {
			method: 'POST',
			body: formData,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
		});

		if (!response.ok) {
			const json = await response.json();
			const error = `Bad response from Azure fetching access token for user admin (${
				response.status
			}): ${JSON.stringify(json)}`;
			if (options.request) {
				throw options.request.errorHandler.error('userAdminOpFailed', { reason: error });
			} else {
				throw new Error(error);
			}
		}

		this.tokenData = await response.json();

		// assume access token expires one minute before it really does
		this.tokenData.expiresAt = Date.now() + (this.tokenData.expires_in - 60) * 1000;
	}

	// get an access token to use for Azure operations, through cache, or fetched
	async getAccessToken(options) {
		if (options.request) {
			options.request.errorHandler.add(UserErrors);
		}
		if (!this.tokenData || this.tokenData.expiresAt <= Date.now()) {
			await this.fetchAccessToken(options);
		}
		return this.tokenData.access_token;
	}

	// get a user's properties
	async getUser(userId, options) {
		const response = await this.callMSGraph('GET', `/users/${userId}`, undefined, options);
		return response.json();
	}

	// find a user matching the given email
	async findUserByEmail(email, options) {
		// best way to do this is to search for all users whose email "starts with" the given email
		// in theory, this should not return many results, and then we can search them for the exact match
		email = email.toLowerCase();
		const url = `/users?$filter=startsWith(mail, '${email}')`;
		const response = await this.callMSGraph('GET', url, undefined, options);
		const result = await response.json();
		if (result.value instanceof Array) {
			return result.value.find((user) => user.mail === email);
		} else {
			return null;
		}
	}

	// update a user in the Azure tenant
	async updateUser(userId, props, options) {
		const azureProps = {};
		Object.keys(props).forEach((prop) => {
			const azureProp = PROPS_MAP[prop];
			if (azureProp) {
				azureProps[azureProp] = props[prop];
			}
		});
		if (Object.keys(azureProps).length === 0) {
			return false;
		}

		// always make sure email is lowercase
		if (azureProps.mail) {
			azureProps.mail = azureProps.mail.toLowerCase();
		}

		return this._updateUserNoMap(userId, azureProps, options);
	}

	async _updateUserNoMap(userId, azureProps, options) {
		await this.callMSGraph('PATCH', `/users/${userId}`, azureProps, options);
		return true;
	}

	// delete a user from the Azure tenant
	async deleteUser(userId, options) {
		return this.callMSGraph('DELETE', `/users/${userId}`, undefined, options);
	}

	// create a user in the Azure tenant
	async createUser(props, options) {
		if (!props.email) {
			throw 'must provide email';
		}
		const { tenant } = this.config.integrations.newrelic_azure;

		const creationProps = {
			accountEnabled: true,

			// NOTE: per https://github.com/azure-ad-b2c/user-migration/tree/master/seamless-account-migration
			// we will be setting the custom policy such that when the user logs in for the first time,
			// the seamless flow will ensure their password gets correctly set in Azure B2C
			passwordProfile: {
				password: 'Password123!!',
				forceChangePasswordNextSignIn: false,
			},
			identities: [
				{
					signInType: 'emailAddress',
					issuer: `${tenant}.onmicrosoft.com`,
					issuerAssignedId: props.email,
				},
			],
		};

		const azureProps = {};
		Object.keys(props).forEach((prop) => {
			const azureProp = PROPS_MAP[prop];
			if (azureProp) {
				azureProps[azureProp] = props[prop];
			}
		});
		if (Object.keys(azureProps).length === 0) {
			return false;
		}

		// always make sure email is lowercase
		azureProps.mail = azureProps.mail.toLowerCase();

		Object.assign(creationProps, azureProps);
		let response;
		try {
			response = await this.callMSGraph('POST', '/users', creationProps, options);
		} catch (error) {
			if (error.cause) {
				if (
					error.cause.error &&
					error.cause.error.details &&
					error.cause.error.details[0] &&
					error.cause.error.details[0].code == 'ObjectConflict'
				) {
					if (options.overwrite) {
						const logger = options.request || this.logger;
						if (logger) {
							logger.log(`NOTE: User ${azureProps.mail} exists, overwriting attributes...`);
						}
						return this.updateExistingUserByEmail(azureProps.mail, azureProps, options);
					} else {
						return false;
					}
				}
			}
			throw error;
		}
		return response.json();
	}

	// for a user that is known to exist, locate them by searching for the email,
	// then update the user with the props given
	async updateExistingUserByEmail(email, props, options) {
		const user = await this.findUserByEmail(email, options);
		if (!user) {
			throw new Error(`could not update existing user, user not found`);
		}
		await this._updateUserNoMap(user.id, props, options);
		return Object.assign(user, props);
	}

	// call a Microsoft Graph API
	async callMSGraph(method, uri, body, options) {
		const token = await this.getAccessToken(options);

		const url = `${GRAPH_URL}${uri}`;
		let response;
		try {
			if (options.dryrun) {
				this.logger.log(
					`Would have called MS Graph ${method} ${url} with body: ${JSON.stringify(body)}`
				);
				return true;
			}
			response = await Fetch(url, {
				method,
				body: body ? JSON.stringify(body) : undefined,
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
			});
		} catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			const reason = `Unexpected error from MS Graph on ${method} ${uri}: ${message}`;
			if (options.request) {
				throw options.request.errorHandler.error('userAdminOpFailed', { reason });
			} else {
				throw new Error(reason);
			}
		}

		if (!response.ok) {
			const json = await response.json();
			const error = `Bad response from MS Graph on ${method} ${url} (${
				response.status
			}): ${JSON.stringify(json)}`;
			if (options.request) {
				throw options.request.errorHandler.error('userAdminOpFailed', {
					reason: error,
					details: json,
				});
			} else {
				throw new Error(error, { cause: json });
			}
		}

		return response;
	}
}

module.exports = NewRelicAzureAdmin;
