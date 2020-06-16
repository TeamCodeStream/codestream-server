'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');

class StandardPageRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		this.module.evalTemplate(this, this.initializers.template, {
			version: this.module.versionInfo()
		});
	}

}

module.exports = StandardPageRequest;
