'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class LinkCodemarkRequest extends APIRequest {

	async authorize () {
	}
}

module.exports = LinkCodemarkRequest;
