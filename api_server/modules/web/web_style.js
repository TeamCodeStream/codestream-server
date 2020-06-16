'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebErrorRequest extends APIRequest {

	async authorize () {
		// no authorization needed
	}

	async process () {
		this.response.set('Content-Type', 'text/css').send(this.module.getStylesheet() || '');
		this.responseHandled = true;
	}
}

module.exports = WebErrorRequest;
