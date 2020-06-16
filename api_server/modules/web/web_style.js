'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');

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
