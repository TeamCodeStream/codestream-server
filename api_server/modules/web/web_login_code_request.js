'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');
const LoginCodeHelper = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/login_code_helper');
const WebErrors = require('./errors');

class WebLoginCodeRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		const { email } = this.request.body;
		if (!email) {
			return this.loginError();
		}

		try {
			this.loginCodeHelper = new LoginCodeHelper({
				request: this,
				email: email
			});
			await this.loginCodeHelper.updateUserCode();
		} catch (error) {
			return this.loginError();
		}
		this.finishFlow();
	}

	async postProcess () {
		this.loginCodeHelper.sendEmail();
	}

	finishFlow () {
		const keys = [ 'email', 'finishUrl', 'src', 'teamId', 'tenantId' ];
		//const urlParams = keys.map(key => encodeURIComponent(key) + '=' + encodeURIComponent(passwordSwitchLinkQueryObj[key]))
		const urlParams = keys.reduce((value, key) => {
			if (this.request.body[key]) {
				return value + '&' + encodeURIComponent(key) + '=' + encodeURIComponent(this.request.body[key]);
			} else {
				return value;
			}
		}, '');
		const url = `/web/confirm-code?${urlParams}`;
		this.response.redirect(url);
		this.responseHandled = true;
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

}

module.exports = WebLoginCodeRequest;
