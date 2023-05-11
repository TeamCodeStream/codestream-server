// handle authorizing the current user's New Relic credentials (API key) against
// a particular account ID

'use strict';

const { GraphQLClient, gql } = require('graphql-request');

class NewRelicAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.init();
	}

	init () {
		const secretsList = this.request.api.config.sharedSecrets.commentEngineSecrets;
		if (!secretsList.length) {
			throw this.errorHandler.error('readAuth', { reason: 'server is not configured to support the comment engine' });
		}

		const { headers } = this.request.request;
		if (secretsList.includes(headers['x-cs-newrelic-secret'])) {
			if (headers['x-cs-mock-account-ids']) {
				this.request.warn(`Secret provided to use mock NR account data, this had better be a test!`);
				this.mockAccounts = headers['x-cs-mock-account-ids'].split(',').map(accountId => {
					return { id: accountId };
				});
			} else if (headers['x-cs-mock-error-group-id'] !== undefined) {
				this.mockErrorGroup = headers['x-cs-mock-error-group-id'];
			} else {
				// secret to override this check, for tests
				this.request.warn(`Secret provided to override NR account check, this had better be a test!`);
				this.checkResponse = true;
				return;
			}
		}

		// get the user's NR access token, non-starter if no access token
		const { user } = this.request;
		const token = (
			(
				user.get('providerInfo') &&
				user.get('providerInfo')[this.teamId] &&
				user.get('providerInfo')[this.teamId].newrelic &&
				user.get('providerInfo')[this.teamId].newrelic.accessToken
			) ||
			(
				user.get('providerInfo') &&
				user.get('providerInfo').newrelic &&
				user.get('providerInfo').newrelic.accessToken
			)
		);
		if (!token) {
			this.request.log(`User ${user.id} has no NR token`);
			this.checkResponse = {
				needNRToken: true
			};
		}

		// instantiate graphQL client
		const baseUrl = this.getGraphQLBaseUrl(user);
		this.client = new GraphQLClient(
			baseUrl,
			{
				headers: {
					"Api-Key": token,
					"Content-Type": "application/json",
					"NewRelic-Requesting-Services": "CodeStream"
				}
			}
		);
	}

	// authorize the user to even access this code error: they must have access to the NR account
	// the code error (error group) is associated with
	async authorizeAccount (accountId) {
		if (this.checkResponse) {
			return this.checkResponse;
		}

		try {
			let response;
			if (this.mockAccounts) {
				response = { actor: { accounts: this.mockAccounts } };
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
				response &&
				response.actor &&
				response.actor.accounts &&
				response.actor.accounts.map(account => parseInt(account.id, 10))
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
		if (this.checkResponse) {
			return this.checkResponse;
		}

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
		let response;
		try {
			// we'll do this by directly fetching the error group entity
			// previously, we parsed out the account ID and checked the user's accounts against the error group's
			if (this.mockErrorGroup) {
				response = { actor: { errorsInbox: { errorGroup: { id: this.mockErrorGroup } } } };
			} else {
				const query = gql`
					query errorGroupById($id: ID!) {
						actor {
							errorsInbox {
								errorGroup(id: $id) {
									id
								}
							}
						}
					}`;
				const vars = {
					id: errorGroupGuid
				};
				response = await this.client.request(query, vars);
			}

			if (
				!response ||
				!response.actor ||
				!response.actor.errorsInbox ||
				!response.actor.errorsInbox.errorGroup ||
				!response.actor.errorsInbox.errorGroup.id
			) {
				this.request.warn('Unexpected response fetching error group: ' + JSON.stringify(response));
				return {
					unauthorized: true,
					unexpectedResponse: true
				};
			}
			if (result.id === errorGroupGuid){
				return true;
			}
			else {
				return { 
					unauthorized: true,
					unauthorizedErrorGroup: true
				};
			}
		} catch (error) {
			this.request.warn('Error fetching error group, falling back to account check: ' + error.message);
			return await this.authorizeObjectAccount(errorGroupGuid, 'errorGroup');
		}
		return true;
	}

	// authorize ths user to access the given New Relic object, according to type
	async authorizeObjectAccount (objectId, objectType) {
		if (this.checkResponse) {
			return this.checkResponse;
		}

		if (objectType !== 'errorGroup') {
			return {
				unauthorized: true,
				objectTypeUnknown: true
			};
		}

		// parse out the account ID, and authorize the user against the account
		const accountId = this.accountIdFromErrorGroupGuid(objectId);
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
		const url = this.request.api.config.sharedGeneral.newRelicApiUrl || 'https://api.newrelic.com';
		return `${url}/graphql`;
	}
}

module.exports = NewRelicAuthorizer;
