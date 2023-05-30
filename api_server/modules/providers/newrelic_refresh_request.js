// handle the "PUT /no-auth/provider-refresh/newrelic" request to refresh a New Relic issued access token 

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const NewRelicErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');
const NRAccessTokenRefresher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/nr_access_token_refresher');

class NewRelicRefreshRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
		this.errorHandler.add(NewRelicErrors);
	}

	async authorize () {
		// no authorization necessary
	}

	// process the request...
	async process () {
		await this.requireAllow();
		await this.refreshToken();
		await this.updateUser();
	}

	// require certain parameters, discard unknown parameters
	async requireAllow () {
		return this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['refreshToken', 'provider']
				}
			}
		);
	}

	// refresh the user's token by calling out to New Relic login API
	async refreshToken () {
		this.refreshResult = await NRAccessTokenRefresher({
			request: this,
			tokenInfo: this.request.body,
			force: true
		});
		this.responseData = this.refreshResult.newTokenInfo;
	}

	// update the user with new access token
	async updateUser () {
		// token becomes the user's actual access token for CodeStream, and also the New Relic token
		// for observability functions
		const op = {
			$set: {
				modifiedAt: Date.now(),
				...this.refreshResult.userSet
			}
		};

		this.updateOp = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.refreshResult.user.id
		}).save(op);
	}

	// after the response is sent...
	async postProcess () {
		const message = {
			user: this.updateOp,
			requestId: this.request.id
		};
		const channel = 'user-' + this.refreshResult.user.id;
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish user update message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = NewRelicRefreshRequest;
