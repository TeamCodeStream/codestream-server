'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebLoginRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		this.module.evalTemplate(this, 'login');
	}

}

module.exports = WebLoginRequest;
