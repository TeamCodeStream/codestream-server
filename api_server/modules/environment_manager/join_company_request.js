// handle the "PUT /xenv/join-company/:id" request, to join a company across environments

'use strict';

const JoinCompanyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/join_company_request');
const OneUserPerOrgJoinCompanyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/join_company_request');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const AccessTokenCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/access_token_creator');
const User = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user');

class XEnvJoinCompanyRequest extends JoinCompanyRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	async authorize () {
		// remove this check when we fully move to ONE_USER_PER_ORG
		this.oneUserPerOrg = (
			this.api.modules.modulesByName.users.oneUserPerOrg ||
			this.request.headers['x-cs-one-user-per-org']
		);

		await this.xenvRequireAndAllow();

		// in the authorization phase, we'll fetch the user across environments, and make a copy 
		// of that user object in our environment, this sets us up for a proper join in the local
		// environment, wherein the request can proceed normally
		await this.fetchUser();
		await this.copyUser();
		await this.deleteUser(); // also delete the original user

		if (this.oneUserPerOrg) {
			// pretend the one-user-per-org join-company request is the super-class,
			// a super-duper ugly HACK until we get to ONE_USER_PER_ORG
			await OneUserPerOrgJoinCompanyRequest.prototype.authorize.call(this);
		} else {
			return super.authorize();
		}
	}

	// require certain parameters, and discard unknown parameters
	async xenvRequireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				string: ['serverUrl', 'userId']
			}
		});
	}

	// fetch the user across environments
	async fetchUser () {
		const { serverUrl, userId } = this.request.body;
		if (!this.request.headers.authorization) {
			this.response.status(401);
			throw this.errorHandler.error('missingAuthorization');
		}
		const accessToken = this.request.headers.authorization.split('Bearer ')[1];
		if (!accessToken) {
			this.response.status(401);
			throw this.errorHandler.error('missingAuthorization');
		}

		this.user = await this.api.services.environmentManager.fetchUserFromHostById(serverUrl, userId);
		if (!this.user) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}

		// the access token passed must match the user's stored access token
		const token = this.user.accessTokens && this.user.accessTokens.web && this.user.accessTokens.web.token;
		if (token !== accessToken) {
			throw this.errorHandler.error('updateAuth', { reason: 'token mismatch' });
		}
	}

	// copy the user we fetched from across environments into this environment
	// as a failsafe, we'll ensure the user's ID doesn't exist in our local database 
	// (our hope is that collisions are extremely unlikely)
	async copyUser () {
		// under one-user-per-org, we expect an existing record for the invited user,
		// or, if joining by domain, a new user record will be created in any case
		// SO: here we only create a memory-only user record to carry the attributes
		if (this.oneUserPerOrg) {
			this.user = new User(this.user);
			return;
		}

		const collidingUser = await this.data.users.getById(this.user.id);
		if (collidingUser) {
			throw this.errorHandler.error('internal', { info: `found a colliding user matching ID ${this.user.id}` });
		}

		// create an access token for the copy of the user, access tokens don't translate across environments
		const { token, minIssuance } = AccessTokenCreator(this, this.user.id);
		this.user.accessTokens = this.user.accessTokens || {};
		this.user.accessTokens.web = { token, minIssuance };

		// save the user
		await this.data.users.createDirect(this.user);

		// fetch again, and proceed with processing the request
		const userId = this.user.id;
		this.user = await this.data.users.getById(userId);
		if (!this.user) {
			throw this.errorHandler.error('internal', { info: `cross-environment user ${userId} was not created locally` });
		}
		this.request.user = this.user; // make this user the submitter of the request
	}

	// delete the original user, since they joined a company in this environment
	async deleteUser () {
		const { serverUrl, userId } = this.request.body;
		return this.api.services.environmentManager.deleteUserFromHostById(serverUrl, userId);
	}

	async process () {
		// pretend the one-user-per-org join-company request is the super-class,
		// a super-duper ugly HACK until we get to ONE_USER_PER_ORG
		if (this.oneUserPerOrg) {
			this.duplicateUser = OneUserPerOrgJoinCompanyRequest.prototype.duplicateUser;
			this.confirmUser = OneUserPerOrgJoinCompanyRequest.prototype.confirmUser;
			this.addUserToTeam = OneUserPerOrgJoinCompanyRequest.prototype.addUserToTeam;
			return OneUserPerOrgJoinCompanyRequest.prototype.process.call(this);
		} else {
			return super.process();
		}
	}

	async postProcess () {
		// pretend the one-user-per-org join-company request is the super-class,
		// a super-duper ugly HACK until we get to ONE_USER_PER_ORG
		if (this.oneUserPerOrg) {
			return OneUserPerOrgJoinCompanyRequest.prototype.postProcess.call(this);
		} else {
			return super.postProcess();
		}
	}
}

module.exports = XEnvJoinCompanyRequest;
