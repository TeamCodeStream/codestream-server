'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class Web404Request extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		this.module.evalTemplate(this, '404', {
			version: this.module.versionInfo()
		});
	}

}

module.exports = Web404Request;
