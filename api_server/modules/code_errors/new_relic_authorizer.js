// handle authorizing the current user's New Relic credentials (API key) against
// a particular account ID

'use strict';

const GraphQLClient = require('graphql-client');

class NewRelicAuthorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	// authorize the user to even access this code error: they must have access to the NR account
	// the code error (error group) is associated with
	async authorizeAccount (accountId) {
		let mockAccounts;
		const secretsList = this.request.api.config.sharedSecrets.commentEngineSecrets;
		if (!secretsList.length) {
			throw this.errorHandler.error('readAuth', { reason: 'server is not configured to support the comment engine' });
		}

		const { headers } = this.request.request;
		if (secretsList.includes(headers['x-cs-newrelic-secret'])) {
			if (headers['x-cs-mock-account-ids']) {
				this.request.warn(`Secret provided to use mock NR account data, this had better be a test!`);
				mockAccounts = headers['x-cs-mock-account-ids'].split(',').map(accountId => {
					return { id: accountId }
				});
			} else {
				// secret to override this check, for tests
				this.request.warn(`Secret provided to override NR account check, this had better be a test!`);
				return true;
			}
		}

		// get the user's NR access token, non-starter if no access token
		const { user } = this.request;
		const token = (
			user.get('providerInfo') &&
			user.get('providerInfo')[this.teamId] &&
			user.get('providerInfo')[this.teamId].newrelic &&
			user.get('providerInfo')[this.teamId].newrelic.accessToken
		);
		if (!token) {
			mockAccounts = { id: accountId };
			this.request.log(`User ${user.id} has no NR token`);
			return {
				needNRToken: true
			};
		}

		// instantiate graphQL client
		const baseUrl = this.getGraphQLBaseUrl(user);
		const client = GraphQLClient({
			url: baseUrl,
			headers: {
				"Api-Key": token,
				"Content-Type": "application/json",
				"NewRelic-Requesting-Services": "CodeStream"
			}
		});

		try {
			let response;
			if (mockAccounts) {
				response = { data: { actor: { accounts: mockAccounts } } };
			} else {
				response = await client.query(`{
					actor {
						accounts {
							id
						}
					}
				}`);
			}

			const accountIds = (
				response.data &&
				response.data.actor &&
				response.data.actor.accounts &&
				response.data.actor.accounts.map(account => parseInt(account.id, 10))
			);
			this.request.log('NR user has account IDs:' + accountIds);
			if (accountIds && accountIds.includes(accountId)) {
				return true;
			} else {
				return {
					unauthorized: true,
					unauthorizedAccount: true
				};
			}
		} catch (error) {
			this.request.warn('Error fetching New Relic account info: ' + error.message);
			return {
				unauthorized: true,
				tokenError: true
			};
		}
	}

	// authorize ths user to access the given New Relic object, according to type
	async authorizeObject (objectId, objectType) {
		switch (objectType) {
			case 'errorGroup':
				return this.authorizeErrorGroup(objectId);
			default:
				return {
					unauthorized: true,
					objectTypeUnknown: true
				};
		}
	}

	// authorize the user to access the given New Relic error group, given by GUID
	async authorizeErrorGroup (errorGroupGuid) {
		// parse out the account ID, and authorize the user against the account
		const accountId = this.accountIdFromErrorGroupGuid(errorGroupGuid);
		if (!accountId) {
			return { 
				unauthorized: true,
				noParseGuid: true
			};
		}
		return this.authorizeAccount(accountId);
	}

	// parse the account ID out from the error group guid
	accountIdFromErrorGroupGuid (guid) {
		const parsed = Buffer.from(guid, "base64").toString("utf-8");
		if (!parsed) {
			return false;
		}
		const split = parsed.split(/\|/);
		return parseInt(split[0], 10);
	}

	// get the base URL for New Relic GraphQL client
	getGraphQLBaseUrl (user) {
		let url;
		const data = (
			user.get('providerInfo') &&
			user.get('providerInfo')[this.teamId] &&
			user.get('providerInfo')[this.teamId].newrelic &&
			user.get('providerInfo')[this.teamId].newrelic.data
		); 
		if (!data || (!data.usingEU && !data.apiUrl)) {
			url = 'https://api.newrelic.com';
		} else if (data.usingEU) {
			url = 'https://api.eu.newrelic.com';
		} else {
			url = data.apiUrl.replace(/\/$/, '');
		}

		return `${url}/graphql`;
	}
}

module.exports = NewRelicAuthorizer;
