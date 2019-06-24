'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebPasswordResetInvalid extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		this.module.evalTemplate(this, 'password_reset_invalid', {
			version: this.module.versionInfo(),
		});
	}
}

module.exports = WebPasswordResetInvalid;
