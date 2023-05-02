// handle authorizing the current user's New Relic credentials (API key) against
// a particular account ID

'use strict';

const { GraphQLClient, gql } = require('graphql-request');

class NewRelicAuthorizer {

	constructor (options) {
		Object.assign(this, options);
	}

	async init () {
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
			} else if (headers['x-cs-mock-error-group-ids'] !== undefined) {
				this.mockErrorGroups = headers['x-cs-mock-error-group-ids'].split(',').map(groupId => {
					return { id: groupId };
				});
			} else {
				// secret to override this check, for tests
				this.request.warn(`Secret provided to override NR account check, this had better be a test!`);
				this.checkResponse = true;
				return;
			}
		} 

		// get the user's NR access token, non-starter if no access token
		const user = this.adminUser || this.request.user;
		const teamProviderInfo = (
			user.get('providerInfo') &&
			user.get('providerInfo')[this.teamId] &&
			user.get('providerInfo')[this.teamId].newrelic
		);
		const userProviderInfo = (
			user.get('providerInfo') &&
			user.get('providerInfo').newrelic
		);
		let providerInfo, fromTeam;
		if (teamProviderInfo && teamProviderInfo.accessToken) {
			providerInfo = teamProviderInfo;
			fromTeam = true;
		} else if (userProviderInfo && userProviderInfo.accessToken) {
			providerInfo = userProviderInfo;
		}
		const token = providerInfo && providerInfo.accessToken;
		if (!token) {
			this.request.log(`User ${user.id} has no NR token`);
			this.checkResponse = {
				needNRToken: true
			};
			return;
		}

		if (headers['x-cs-no-newrelic']) {
			this.request.warn('No New Relic specified in request, not making graphql client');
			return;
		}

		// refresh the token as needed
		await this.refreshTokenAsNeeded(user, providerInfo, fromTeam ? this.teamId : null);

		// Unified Identity tokens are cookies, not api keys
		const graphQLHeaders = {
			"Content-Type": "application/json",
			"NewRelic-Requesting-Services": "CodeStream"
		};
		if (providerInfo.setCookie) {
			graphQLHeaders.Cookie = `${providerInfo.setCookie}=${token};`;
		} else if (providerInfo.bearerToken) {
			graphQLHeaders.Authorization = `Bearer ${token}`;
		} else {
			graphQLHeaders['Api-Key'] = token;
		}

		// instantiate graphQL client
		const baseUrl = this.getGraphQLBaseUrl();
		this.client = new GraphQLClient(
			baseUrl,
			{
				headers: graphQLHeaders
			}
		);
	}

	// check for a (nearly) expired token and refresh as needed
	async refreshTokenAsNeeded (user, providerInfo, teamId) {
		// refresh only applies to cookies, and we can't refresh if there isn't a refresh token
		if (!providerInfo.bearerToken || !providerInfo.refreshToken) {
			return providerInfo;
		}

		// refresh if token expires less than one minute from now
		if (!providerInfo.expiresAt || providerInfo.expiresAt > Date.now() + 59 * 60 * 1000) {
			return providerInfo;
		}

		// refresh away
		return this.refreshToken(user, providerInfo, teamId);
	}

	// refresh user's NR token and return new providerInfo
	async refreshToken (user, providerInfo, teamId) {
		const incomingRefreshToken = providerInfo.refreshToken;

		// call out to IDP service to refresh the token
		const refreshResponse = await this.request.api.services.idp.refreshToken(
			incomingRefreshToken,
			{ request: this.request }
		);

		// save the token
		const { id_token, refresh_token, expires_in } = refreshResponse;
		const op = {
			$set: {
				[ `providerInfo.${teamId}.newrelic.accessToken` ]: id_token,
				[ `providerInfo.${teamId}.newrelic.refreshToken` ]: refresh_token,
				//[ `providerInfo.${this.team.id}.newrelic.setCookie` ]: setCookie,
				[ `providerInfo.${teamId}.newrelic.bearerToken` ]: true,
			},
		};
		let expiresAt;
		if (expires_in) {
			expiresAt = Date.now() + expires_in * 1000;
			op[`providerInfo.${teamId}.newrelic.expiresAt`] = expiresAt;
		}
		await this.request.data.users.applyOpById(user.id, op);

		Object.assign(providerInfo, {
			accessToken: id_token,
			refreshToken: refresh_token,
			expiresAt
		});
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
				response = await this.client.query(`{
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
			if (this.mockErrorGroups) {
				response = { actor: { errorsInbox: { errorGroups: { results: this.mockErrorGroups } } } };
			} else {
				const query = gql`
					query errorGroupById($ids: [ID!]) {
						actor {
							errorsInbox {
								errorGroups(filter: {ids: $ids}) {
									results {
										id
									}
								}
							}
						}
					}`;
				const vars = {
					ids: [errorGroupGuid]
				};
				response = await this.client.request(query, vars);
			}

			if (
				!response ||
				!response ||
				!response.actor ||
				!response.actor.errorsInbox ||
				!response.actor.errorsInbox.errorGroups ||
				!response.actor.errorsInbox.errorGroups.results ||
				!response.actor.errorsInbox.errorGroups.results
			) {
				this.request.warn('Unexpected response fetching error groups: ' + JSON.stringify(response));
				return {
					unauthorized: true,
					unexpectedResponse: true
				};
			}
			if (!response.actor.errorsInbox.errorGroups.results.find(result => {
				return result.id === errorGroupGuid;
			})) {
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

	// determine when an NR account has the "unlimited_consumption" entitlement,
	// used to determine, in part, whether its org is "codestream only"
	async nrOrgHasUnlimitedConsumptionEntitlement (accountId, options = {}) {
		let response;
		if (options.mockResponse) {
			response = {
				currentUser: {
					account: {
						subscriptions: [
							{
								entitlements: [
								]
							}
						]
					}
				}
			};
			if (options.mockNoCodeStreamOnly) {
				response.currentUser.account.subscriptions[0].entitlements.push({ name: 'unlimited_consumption' });
			}
		} else {
			const query = gql`
{
	currentUser {
		account(id: ${accountId}) {
			subscriptions {
				entitlements {
					attributes {
			  			key
			  			value
					}
					name
				}
			}
		}
	}
}`;
			response = await this.client.request(query);
		}

		return (
			response.currentUser && 
			response.currentUser.account &&
			response.currentUser.account.subscriptions &&
			response.currentUser.account.subscriptions &&
			!!response.currentUser.account.subscriptions.find(subscription => {
				return (
					subscription.entitlements &&
					!!subscription.entitlements.find(entitlement => {
						return entitlement.name === 'unlimited_consumption';
					})
				);
			})
		);
	}

	// delete the given user
	async deleteUser (id, options = {}) {
		let response;
		if (options.mockResponse) {
			response = {
				userManagementDeleteUser: {
					deletedUser: {
						id: `${id}`
					}
				}
	  		};
		} else {
			const mutation = gql`
mutation {
	userManagementDeleteUser(deleteUserOptions: {id: "${id}"}) {
		deletedUser {
			id
		}
	}
}`;

			response = await this.client.request(mutation, { id });
		}
		return;
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
	getGraphQLBaseUrl () {
		const host = this.graphQLHost || this.request.api.config.sharedGeneral.newRelicApiUrl || 'https://api.newrelic.com';
		return `${host}/graphql`;
	}
}

module.exports = NewRelicAuthorizer;
