'use strict';

const WebRequestBase = require('./web_request_base');

class PasswordUpdatedRequest extends WebRequestBase {
	async authorize() {
	}
	async process() {
		const email = this.request.query.email ? decodeURIComponent(this.request.query.email) : '';

		return super.render('password_updated', {
			email
		});

	}
}

module.exports = PasswordUpdatedRequest;
