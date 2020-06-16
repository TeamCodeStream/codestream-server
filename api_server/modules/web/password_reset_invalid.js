'use strict';

const WebRequestBase = require('./web_request_base');

class PasswordResetRequest extends WebRequestBase {
	async authorize() {
	}
	async process() {
		return super.render('password_reset_invalid');
	}
}

module.exports = PasswordResetRequest;