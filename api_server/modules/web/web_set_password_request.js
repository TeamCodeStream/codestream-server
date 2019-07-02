// handles the GET request
'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const CheckResetCore = require(process.env.CS_API_TOP + '/modules/users/check_reset_core');
const AuthErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');

class WebSetPasswordRequest extends RestfulRequest {

	constructor(options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

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

		this.render({
			email: user.get('email'),
			token: token
		});	 
	}

	render(viewModel) {		
		let data = Object.assign({}, viewModel, {
			csrf: this.request.csrfToken(),
			version: this.module.versionInfo(),
		});

		this.module.evalTemplate(this, 'password_set', data);
	}

	redirectError() {		
		this.response.redirect('/web/user/password/reset/invalid');
		this.responseHandled = true;
	}
}

module.exports = WebSetPasswordRequest;
