'use strict';

var Get_Request = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class Get_User_Request extends Get_Request {

	process (callback) {
		if (this.request.params.id === '~') {
			this.response_data = { user: this.user.get_sanitized_object() };
			return process.nextTick(callback);
		}
		super.process(callback);
	}
}

module.exports = Get_User_Request;
