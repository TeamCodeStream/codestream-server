'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class Web404Request extends APIRequest {
	async authorize() {
	}
	async process() {
		this.module.evalTemplate(this, '404', {
			isAuthenticated: this.user != null
		});
	}
}

module.exports = Web404Request;
