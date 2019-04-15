'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebErrorRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		this.module.evalTemplate(this, 'error', {
			version: this.module.versionInfo(),
			code: this.request.query.code
		});
	}
}

module.exports = WebErrorRequest;
