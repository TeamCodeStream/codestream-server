// handles the GET request
'use strict';

const CheckResetCore = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/check_reset_core');
const WebRequestBase = require('./web_request_base');

class WebSetPasswordRequest extends WebRequestBase {

	async authorize() {
		// no authorization needed
	}

	async process() {
		const token = this.request.query.token;
		if (!token) {
			this.warn('No token found in request');
			this.redirectError();
			return;
		}

		let user;
		try {
			user = await new CheckResetCore({
				request: this
			}).getUserFromToken(token);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Error thrown in checking reset: ' + message);
			this.redirectError();
			return;
		}


		return super.render('password_set', {
			email: user.get('email'),
			token: token,
			csrf: this.request.csrfToken()
		});

	}


	redirectError() {
		this.response.redirect('/web/user/password/reset/invalid');
		this.responseHandled = true;
	}
}

module.exports = WebSetPasswordRequest;
