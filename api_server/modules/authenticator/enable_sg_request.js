// handle the "GET /no-auth/enable-sg" request, to enable Service Gateway header reception

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');

class EnableSGRequest extends RestfulRequest {

	async authorize () {
		// authorization handled in process
		return true;
	}

	// process the request...
	async process () {
		await this.requireAndAllow();

	// cheat to turn on Service Gateway header acceptance as a global "variable"
	// THIS SHOULD NOT BE ENABLED IN PRODUCTION
		if (this.api.config.sharedGeneral.isProductionCloud || this.api.config.sharedGeneral.runTimeEnvironment === 'stg') {
			throw this.errorHandler.error('updateAuth', { reason: 'SG enable not supported in this environment'});
		}

		if (this.request.body._subscriptionCheat !== this.api.config.sharedSecrets.subscriptionCheat) {
			throw this.errorHandler.error('updateAuth', { reason: 'SG enable not authorized'});
		}

		this.warn(`NOTE: Accepting Service Gateway enable (enable=${this.request.body.enable}), this had better be a test!`);
		await this.api.data.globals.updateDirect(
			{ tag: 'acceptSGHeaders' },
			{ $set: { tag: 'acceptSGHeaders', enabled: !!this.request.body.enable } },
			{ upsert: true }
		);
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('body', {
			required: {
				boolean: ['enable'],
				string: ['_subscriptionCheat']
			}
		});
	}
}

module.exports = EnableSGRequest;
