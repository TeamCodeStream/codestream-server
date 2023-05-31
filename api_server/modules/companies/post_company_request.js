// handle the 'POST /companies' request, to create a new company

'use strict';

const PostRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/post_request');
const TeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_creator');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class PostCompanyRequest extends PostRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(NewRelicIDPErrors);
	}
	
	async authorize () {
		// anyone can create a company at any time
	}

	// process the request
	async process () {
		this.teamCreatorClass = TeamCreator; // this avoids a circular require
		return super.process();
	}

	// handle response to the incoming request
	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}

		// only return a full response if this was the user's first company
		if (this.transforms.additionalCompanyResponse) {
			this.log('NOTE: sending additional company response to POST /companies request');
			this.responseData = this.transforms.additionalCompanyResponse;
			this.teamId = this.responseData.teamId;
		} else {
			if (this.transforms.createdTeam) {
				this.responseData.team = this.transforms.createdTeam.getSanitizedObject({ request: this });
				this.responseData.team.companyMemberCount = 1;
				this.teamId = this.transforms.createdTeam.id;
			}
			if (this.transforms.createdTeamStream) {
				this.responseData.streams = [
					this.transforms.createdTeamStream.getSanitizedObject({ request: this })
				]
			}
			if (this.transforms.newAccessToken) {
				this.responseData.accessToken = this.transforms.newAccessToken;
			}
		}

		if (this.transforms.userUpdate) {
			this.responseData.user = this.transforms.userUpdate;
			if (this.responseData.user.$set) {
				delete this.responseData.user.$set.nrUserInfo;
			}
		}

		return super.handleResponse();
	}

	// after we've processed the request....
	async postProcess () {
		if (!this.transforms.additionalCompanyResponse) {
			await this.publishUserUpdate();
		}

		// evidently there is some kind of race condition in the Azure B2C API which causes
		// the refresh token first issued on the login request to be invalid, so here we return
		// a response to the client with a valid access token, but knowing the refresh token
		// isn't valid ... but we'll fetch a new refresh token after a generous period of time 
		// to allow the race condition to clear
		await this.updateRefreshToken();
	}

	// evidently there is some kind of race condition in the Azure B2C API which causes
	// the refresh token first issued on the login request to be invalid, so here we return
	// a response to the client with a valid access token, but knowing the refresh token
	// isn't valid ... but we'll fetch a new refresh token after a generous period of time 
	// to allow the race condition to clear
	async updateRefreshToken () {
		if (this.request.headers['x-cs-no-newrelic'] || !this.request.headers['x-cs-enable-uid']) {
			return;
		}

		const password = this.creator.password;
		this.log('Initiating delayed token refresh for New Relic IDP...');
		const tokenInfo = await this.api.services.idp.waitForRefreshToken(this.user.get('email'), password, { request: this });

		// check if we are using Service Gateway auth (login service),
		// if so, we use the NR token as our actual access token
		let serviceGatewayAuth = await this.api.data.globals.getOneByQuery(
			{ tag: 'serviceGatewayAuth' }, 
			{ overrideHintRequired: true }
		);
		serviceGatewayAuth = serviceGatewayAuth && serviceGatewayAuth.enabled;

		// save the new access token to the database...
		const { token, refreshToken, expiresAt, provider } = tokenInfo;
		const op = { 
			$set: {
				[ `providerInfo.${this.teamId}.newrelic.accessToken` ]: token,
				[ `providerInfo.${this.teamId}.newrelic.refreshToken` ]: refreshToken,
				[ `providerInfo.${this.teamId}.newrelic.expiresAt` ]: expiresAt,
				[ `providerInfo.${this.teamId}.newrelic.provider` ]: provider
			}
		};

		// also save as our actual access token if service gateway auth is active
		if (serviceGatewayAuth) {
			Object.assign(op.$set, {
				[ `accessTokens.web.token`]: token,
				[ `accessTokens.web.refreshToken`]: refreshToken,
				[ `accessTokens.web.expiresAt`]: expiresAt,
				[ `accessTokens.web.provider`]: provider
			});
		}

		const updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
		await this.postProcessPersist();

		// ...and publish a message that it has been updated to the user
		const message = {
			requestId: this.request.id,
			user: updateOp
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish refresh token update message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// publish a joinMethod update if the joinMethod attribute was changed for the user as
	// a result of fulfilling this request
	async publishUserUpdate () {
		const message = {
			requestId: this.request.id,
			company: this.responseData.company,
			team: this.responseData.team,
			user: this.transforms.userUpdate
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this	}
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish company creation message to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}

	// describe this route for help
	static describe (module) {
		const description = PostRequest.describe(module);
		description.description = 'Creates a new company';
		description.access = 'No access rules; anyone can create a new company at any time.';
		description.input = {
			summary: description.input,
			looksLike: {
				'name*': '<Name of the company>'
			}
		};
		description.returns.summary = 'The created company object';
		return description;
	}
}

module.exports = PostCompanyRequest;
