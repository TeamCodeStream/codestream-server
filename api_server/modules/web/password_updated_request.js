'use strict';

const WebRequestBase = require('./web_request_base');

class PasswordUpdatedRequest extends WebRequestBase {
	async authorize() {
	}
	async process() {
		return super.render('password_updated');
	}
}

module.exports = PasswordUpdatedRequest;
