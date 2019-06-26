// handles the GET request
'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const CheckResetCore = require(process.env.CS_API_TOP + '/modules/users/check_reset_core');

class WebSetPasswordRequest extends RestfulRequest {
	constructor(options) {
		super(options);
	}

	async authorize() {
		// no authorization needed
	}

	async process() {				
		const token = this.request.query.token;
		if (!token) {
			this.redirectError();
			return;
		}

		let user;
		try {
			user = await new CheckResetCore({
				request: this,
				errorHandler: this.errorHandler
			}).getUserFromToken(token);
		}
		catch (error) {
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
