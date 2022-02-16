// handles the POST request
'use strict';

const CheckResetCore = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/check_reset_core');
const ChangePasswordCore = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/change_password_core');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');
const WebRequestBase = require('./web_request_base');

class SetPasswordRequest extends WebRequestBase {

	constructor(options) {
		super(options);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthErrors);
	}

	async authorize() {
		// no authorization needed
	}

	async requireAndAllow() {
		delete this.request.body._csrf;
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token', 'password']
				},
				optional: {
					string: ['fromWeb']
				}
			}
		);
	}

	async process() {
		await this.requireAndAllow();

		const { password, token } = this.request.body;
		if (!token) {
			//something happened between render and POST... (tampering? redirect it.)
			this.warn('No token found in request');
			this.redirectError();
			return;
		}

		let user;
		try {
			user = await new CheckResetCore({
				request: this
			}).getUserFromToken(token);

			if (!user) {
				//can't find a user, no need to try again
				this.warn('User not found');
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

			const requestEmail = encodeURIComponent(user.get('email'));
			this.response.redirect(`/web/user/password/updated?email=${requestEmail}`);
			this.responseHandled = true;
		}
		catch (error) {
			if (typeof error === 'object' && error.code === 'RAPI-1005') {
				this.render({
					error: error.info || 'something unexpected happened',
					email: user.get('email'),
					token: token
				});
				return;
			}

			// something else bad happened -- just redirect to failure screen
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.warn('Error resetting password: ' + message);
			this.redirectError();
			return;
		}
	}

	async render(viewModel) {
		const { fromWeb } = this.request.body;

		return super.render('password_set', Object.assign({}, viewModel, {
			csrf: this.request.csrfToken(),
			fromWeb: fromWeb
		}));
	}

	redirectError() {
		this.response.redirect('/web/user/password/reset/invalid');
		this.responseHandled = true;
	}
}

module.exports = SetPasswordRequest;
