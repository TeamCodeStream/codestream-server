'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const CheckResetCore = require(process.env.CS_API_TOP + '/modules/users/check_reset_core');
const ChangePasswordCore = require(process.env.CS_API_TOP + '/modules/users/change_password_core');

class WebPasswordSet extends RestfulRequest {
	constructor(options) {
		super(options);
	}

	async authorize() {
		// no authorization needed
	}

	async requireAndAllow() {
		if (this.request.method === 'POST') {
			await this.requireAllowParameters(
				'body',
				{
					required: {
						string: ['token', 'password']
					}
				}
			);
		}
	}

	async process() {
		await this.requireAndAllow();
		let user;
		if (this.request.method === 'POST') {
			const { password, token } = this.request.body;
			if (!token) {
				//something happened between render and POST... (tampering? redirect it.)
				this.redirectError();
				return;
			}

			try {
				user = await new CheckResetCore({
					request: this,
					errorHandler: this.errorHandler
				}).getUserFromToken(token);

				if (!user) {
					//can't find a user, no need to try again
					this.redirectError();
					return;
				}

				if (!password) {
					this.render({
						error: 'password is required',
						email: user.get('email'),
						token: token
					});
					return;
				}

				await new ChangePasswordCore({
					request: this,
					errorHandler: this.errorHandler
				}).setPassword(user, password);

				this.response.redirect('/web/user/password/updated');
				this.responseHandled = true;
			}
			catch (error) {
				if (typeof error === 'object' && error.message === 'Validation error') {					
					this.render({
						error: error.info || 'something unexpected happened',
						email: user.get('email'),
						token: token
					});					
					return;
				}
				
				// something else bad happened -- just redirect to failure screen
				this.redirectError();				
				return;
			}
		}
		else {
			const token = this.request.query.token;
			if (!token) {
				this.redirectError();
				return;
			}

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

module.exports = WebPasswordSet;
