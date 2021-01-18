'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');
const LoginCore = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/login_core');
const SigninFlowUtils = require('./signin_flow_utils');
const WebErrors = require('./errors');

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

			if (this.request.body.tenantId) {
				this.interstitial = '/web/assign/team?tenantId=' + this.request.body.tenantId;
			}
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
		const error = WebErrors.invalidLogin.code;
		const email = encodeURIComponent(this.request.body.email || '');
		const url = encodeURIComponent(this.request.body.finishUrl || '');
		let redirect = `/web/login?error=${error}&email=${email}&url=${url}`;
		if (this.request.body.tenantId) {
			redirect += '&tenantId=' + encodeURIComponent(this.request.body.tenantId || '');
		}
		if (this.request.body.src) {
			redirect += '&src=' + encodeURIComponent(this.request.body.src || '');
		}
		this.response.redirect(redirect);
		this.responseHandled = true;
	}

	issueCookie () {
		this.token =
			(this.user.get('accessTokens') || {}) &&
			(this.user.get('accessTokens').web || {}) &&
			this.user.get('accessTokens').web.token;
		if (!this.token) {
			return false;
		}

		this.response.cookie(this.api.config.apiServer.identityCookie, this.token, {
			secure: true,
			signed: true
		});
		return true;
	}

	finishFlow () {
		if (this.interstitial) {
			this.response.redirect(this.interstitial);
			this.responseHandled = true;
		}
		else {
			this.responseHandled = new SigninFlowUtils(this).finish(this.request.body.finishUrl, {
				src: this.request.body.src
			});
		}
	}
}

module.exports = WebSigninRequest;
