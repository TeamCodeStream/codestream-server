'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');
const LoginCore = require(process.env.CS_API_TOP + '/modules/users/login_core');

class WebSigninRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const { email, password } = this.request.body;
		if (!email || !password) {
			return this.loginError();
		}

		// attempt to login with email and password, and fetch the user
		try {
			this.user = await new LoginCore({
				request: this
			}).login(email, password);
		}
		catch (error) {
			return this.loginError();
		}

		// send a cookie in the response
		if (!this.issueCookie()) {
			return this.loginError();
		}

		// now we can go to the intended url, if any
		this.finishFlow();
	}

	loginError () {
		this.module.evalTemplate(
			this,
			'login',
			{ 
				error: 'Sorry, you entered an incorrect email or password.',
				email: this.request.body.email,
				finishUrl: this.request.body.finishUrl
			}
		);
	}

	issueCookie () {
		this.token = 
			(this.user.get('accessTokens') || {}) &&
			(this.user.get('accessTokens').web || {}) &&
			this.user.get('accessTokens').web.token;
		if (!this.token) {
			return false;
		}

		this.response.cookie('t', this.token, {
			secure: true,
			signed: true
		});
		return true;
	}

	finishFlow () {
		if (this.request.body.finishUrl) {
			this.response.redirect(this.request.body.finishUrl);
		}
		else {
			this.response.redirect('/web/finish');
		}
		this.responseHandled = true;
	}
}

module.exports = WebSigninRequest;
