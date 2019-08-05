'use strict';

const APIRequest = require(process.env.CS_API_TOP + '/lib/api_server/api_request.js');

class WebLogOutRequest extends APIRequest {
	async authorize() {
	}
	async process() {
		this.response.clearCookie('tcs', {
			secure: true,
			signed: true
		});
		this.response.redirect('/web/login');
		this.responseHandled = true;
	}
}

module.exports = WebLogOutRequest;
