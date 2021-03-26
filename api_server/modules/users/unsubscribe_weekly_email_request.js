// handle the GET /no-auth/unsubscribe-weekly request to unsubscribe from weekly emails 

'use strict';

const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const WebErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/errors');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class UnsubscribeWeeklyEmailRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	// authorize the request for the current user
	async authorize () {
		// authentication is passed as a JSONWebToken in the query parameters
		let error;
		try {
			const token = this.request.query.t;
			if (!token) {
				error = this.errorHandler.error('missingAuthorization');
			}
			else {
				this.tokenPayload = this.api.services.tokenHandler.verify(token);
			}
		}
		catch (e) {
			error = e;
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				error = this.errorHandler.error('tokenExpired');
			}
			else {
				error = this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (!error && this.tokenPayload.type !== 'unsscr') {
			error = this.errorHandler.error('tokenInvalid', { reason: 'not an unsubscribe token' });
		}

		if (error) {
			this.gotError = error;
		}
	}

	// process the request...
	async process () {
		if (this.gotError) { return; }
		try {
			await this.getUser();

			const now = Date.now();
			const op = { 
				$set: {
					'preferences.weeklyEmailDelivery': false,
					modifiedAt: now
				}
			};
			this.updateOp = await new ModelSaver({
				request: this.request,
				collection: this.data.users,
				id: this.user.id
			}).save(op);
		} catch (error) {
			this.gotError = error;
		}
	}

	// get the user who initiated this request from the token payload
	async getUser () {
		this.user = await this.data.users.getById(this.tokenPayload.uid);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	async handleResponse () {
		if (this.gotError) {
			this.warn(ErrorHandler.log(this.gotError));
			const errorCode = typeof this.gotError === 'object' && this.gotError.code ? this.gotError.code : WebErrors['unknownError'].code;
			this.response.redirect(`/web/unsubscribe-weekly-error?error=${errorCode}`);
		}
		else {
			this.responseData = { user: this.updateOp };
			this.response.redirect('/web/unsubscribe-weekly-complete');
		}
		this.responseHandled = true;
	}

	// after the response has been returned...
	async postProcess () {
		if (this.gotError) { return; }
		
		// track the event
		this.trackUnsubscribe();

		// send the message to the user's me-channel, so other sessions know that the
		// preferences have been updated
		const channel = 'user-' + this.user.id;
		const message = Object.assign({}, this.responseData, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate
			this.warn(`Unable to publish unsubscribe from weekly emails message to channel ${channel}: ${JSON.stringify(error)}`);
		}
	}

	// track an event indicating the user unsubscribed
	async trackUnsubscribe () {
		const trackObject = {
			'Email Type': 'Weekly Activity'
		};
		this.api.services.analytics.trackWithSuperProperties(
			'Unsubscribed',
			trackObject,
			{
				request: this,
				user: this.user
			}
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'unsubscribe-weekly-link',
			summary: 'Respond to email link to unsubscribe from weekly emails',
			access: 'User is authenticated through the token provided.',
			description: 'Response to email link to unsubscribe from weekly emails.',
			input: 'A "t" parameter must be present in the query parameters, interpreted as a JSONWebToken which identifies the user',
			returns: 'Redirects to /web/unsubscribe-weekly-complete',
			publishes: 'The response data will be published on the user channel'
		};
	}
}

module.exports = UnsubscribeWeeklyEmailRequest;
