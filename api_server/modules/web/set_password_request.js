// handles the POST request
'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const CheckResetCore = require(process.env.CS_API_TOP + '/modules/users/check_reset_core');
const ChangePasswordCore = require(process.env.CS_API_TOP + '/modules/users/change_password_core');
const AuthErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const UserErrors = require(process.env.CS_API_TOP + '/modules/users/errors');

class SetPasswordRequest extends RestfulRequest {

	constructor(options) {
		super(options);
		this.errorHandler.add(UserErrors);
		this.errorHandler.add(AuthErrors);
	}

	async authorize() {
		// no authorization needed
	}

	async requireAndAllow() {		
		await this.requireAllowParameters(
			'body',
			{
				required: {
					string: ['token', 'password']
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

			this.response.redirect('/web/user/password/updated');
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

module.exports = SetPasswordRequest;
