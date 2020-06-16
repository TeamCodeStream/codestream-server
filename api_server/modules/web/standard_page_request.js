'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

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
