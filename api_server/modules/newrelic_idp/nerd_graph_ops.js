// handle authorizing the current user's New Relic credentials (API key) against
// a particular account ID

'use strict';

const { GraphQLClient, gql } = require('graphql-request');
const NRAccessTokenRefresher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/nr_access_token_refresher');

class NerdGraphOps {

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
		let token = this.accessToken;
		let tokenType = this.tokenType;
		const user = this.adminUser || this.request.user;
		let providerInfo;
		if (!token) {
			const teamProviderInfo = (
				user.get('providerInfo') &&
				user.get('providerInfo')[this.teamId] &&
				user.get('providerInfo')[this.teamId].newrelic
			);
			const userProviderInfo = (
				user.get('providerInfo') &&
				user.get('providerInfo').newrelic
			);
			if (teamProviderInfo && teamProviderInfo.accessToken) {
				providerInfo = teamProviderInfo;
			} else if (userProviderInfo && userProviderInfo.accessToken) {
				providerInfo = userProviderInfo;
			}
			token = providerInfo && providerInfo.accessToken;
			tokenType = providerInfo && providerInfo.tokenType;
		}
		if (!token) {
			const userId = user ? user.id : '???';
			this.request.log(`User ${userId} has no NR token`);
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
		if (user && providerInfo) {
			const newTokenInfo = await this.refreshTokenAsNeeded(user, providerInfo);
			if (newTokenInfo) {
				token = newTokenInfo.accessToken;
			}
		}

		// Unified Identity tokens are cookies, not api keys
		const graphQLHeaders = {
			"Content-Type": "application/json",
			"NewRelic-Requesting-Services": "CodeStream",
			"X-Query-Source-Capability-Id": "CODESTREAM",
			"X-Query-Source-Component-Id": "codestream.api"
		};
		let graphQLHost;
		if (this.accessToken || providerInfo.bearerToken) {
			graphQLHost = this.request.api.config.integrations.newRelicIdentity.graphQLHost;
			//graphQLHeaders.Authorization = `Bearer ${token}`;
			if (tokenType === 'access') {
				graphQLHeaders['x-access-token'] = token;
			} else {
				graphQLHeaders['x-id-token'] = token;
			}
			const showToken = '<redacted>' + token.slice(-7);
			this.request.log(`NEWRELIC IDP TRACK: GraphQL will use token ${showToken}`);
		} else {
			graphQLHost= this.request.api.config.sharedGeneral.newRelicApiUrl;
			graphQLHeaders['Api-Key'] = token;
		}
		const baseUrl = `${graphQLHost}/graphql`;

		// instantiate graphQL client
		this.client = new GraphQLClient(
			baseUrl,
			{
				headers: graphQLHeaders
			}
		);
	}

	// check for a (nearly) expired token and refresh as needed
	async refreshTokenAsNeeded (user, providerInfo) {
		const result = await NRAccessTokenRefresher({
			request: this.request,
			tokenInfo: providerInfo
		});
		if (!result) {
			return;
		}
		const op = {
			$set: {
				...result.userSet
			},
		};
		await this.request.data.users.applyOpById(user.id, op);

		Object.assign(providerInfo, result.newTokenInfo);
		return result.newTokenInfo;
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
		// we'll do this by directly fetching the error group entity
		// previously, we parsed out the account ID and checked the user's accounts against the error group's
		if (this.mockErrorGroup) {
			response = { actor: { errorsInbox: { errorGroup: { id: this.mockErrorGroup } } } };
		} else {
			try {
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
			catch(error){
				return { 
					unauthorized: true,
					unauthorizedErrorGroup: true
				};
			}
		}

		if (
			!response ||
			!response.actor ||
			!response.actor.errorsInbox ||
			!response.actor.errorsInbox.errorGroup
		) {
			this.request.warn('Unexpected response fetching error group: ' + JSON.stringify(response));
			return {
				unauthorized: true,
				unexpectedResponse: true
			};
		}
		
		if (response.actor.errorsInbox.errorGroup.id === errorGroupGuid) {
			return true;
		}
		
		return { 
			unauthorized: true,
			unauthorizedErrorGroup: true
		};
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

	// get the current user
	async getCurrentUser (options = {}) {
		let response;
		if (options.mockUser) {
			const { name, email, nr_userid, nr_orgid, _pubnubUuid } = options.mockUser;
			return {
				user: {
					name,
					email,
					id: parseInt(nr_userid, 10),
					_pubnubUuid
				},
				organization: {
					id: nr_orgid
				}
			};
		} else {
			try {
				const query = gql`
query {
	actor {
		user {
			name
			email
			id
		}
		organization {
			id
		}
	}
}`;
				response = await this.client.request(query);
			}
			catch (error) {
				throw error;
			}
			return response.actor;
		}
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

	// return the region of the given account
	async regionFromAccountId (accountId) {
		let response;
		try {
			const query = gql`
{
	currentUser {
		account(id: ${accountId}) {
			region {
				code
			}
		}
	}
}
`;
			response = await this.client.request(query);
		}
		catch (error) {
			throw error;
		}
		this.request.log(`NEWRELIC IDP TRACK: regionFromAccountId returned ${JSON.stringify(response)}`);
		return response.currentUser?.account?.region?.code;
	}
}

module.exports = NerdGraphOps;
