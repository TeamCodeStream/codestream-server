'use strict';

var Get_Request = require(process.env.CI_API_TOP + '/lib/util/restful/get_request');
var User = require('./user');

class Get_User_Request extends Get_Request {

	process (callback) {
		if (this.request.params.id === '~') {
			let user = new User(this.user).sanitize().attributes;
			this.response_data = { user };
			return process.nextTick(callback);
		}
		super.process(callback);
	}
}

module.exports = Get_User_Request;
