'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebPasswordUpdated extends APIRequest {
	async authorize () {
		// no authorization needed
	}

	async process () {
		this.module.evalTemplate(this, 'password_updated', {
			version: this.module.versionInfo(),
		});
	}
}

module.exports = WebPasswordUpdated;
