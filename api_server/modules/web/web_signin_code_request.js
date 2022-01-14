'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');
const LoginCore = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/login_core');
const SigninFlowUtils = require('./signin_flow_utils');
const WebErrors = require('./errors');

class WebSigninCodeRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const { email, code } = this.request.body;
		if (!email || !code) {
			return this.loginError();
		}

		// LoginCore expects errorHandler to exist, so we fake it
		this.errorHandler = {
			error: error => error
		};

		// attempt to login with email and code, and fetch the user
		try {
			this.user = await new LoginCore({
				request: this
			}).loginByCode(email, code);

			if (this.request.body.tenantId) {
				this.interstitial = '/web/assign/team?tenantId=' + this.request.body.tenantId;
			}

			await this.invalidateCode();
		} catch (error) {
			return this.loginError(error);
		}

		// send a cookie in the response
		if (!this.issueCookie()) {
			return this.loginError();
		}

		// now we can go to the intended url, if any
		this.finishFlow();
	}

	loginError (sourceError) {
		const error = WebErrors[sourceError] ? WebErrors[sourceError].code : WebErrors.loginCodeMismatch.code;
		const email = encodeURIComponent(this.request.body.email || '');
		const url = encodeURIComponent(this.request.body.finishUrl || '');
		let redirect = `/web/confirm-code?error=${error}&email=${email}&url=${url}`;
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

	async invalidateCode () {
		const op = {
			$unset: {
				loginCode: true,
				loginCodeExpiresAt: true,
				loginCodeAttempts: true,
			},
		};
		this.data.users.applyOpById(this.user.id, op);
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

module.exports = WebSigninCodeRequest;
