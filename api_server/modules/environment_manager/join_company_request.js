// handle the "PUT /xenv/join-company/:id" request, to join a company across environments

'use strict';

const JoinCompanyRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/join_company_request');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');

class XEnvJoinCompanyRequest extends JoinCompanyRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	async authorize () {
		await this.xenvRequireAndAllow();

		// in the authorization phase, we'll fetch the user across environments, and make a copy 
		// of that user object in our environment, this sets us up for a proper join in the local
		// environment, wherein the request can proceed normally
		await this.fetchUser();
		await this.copyUser();
		await this.deleteUser(); // also delete the original user

		return super.authorize();
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
		const collidingUser = await this.data.users.getById(this.user.id);
		if (collidingUser) {
			throw this.errorHandler.error('internal', { info: `found a colliding user matching ID ${this.user.id}` });
		}
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
}

module.exports = XEnvJoinCompanyRequest;
