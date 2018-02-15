'use strict';

var GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetUserRequest extends GetRequest {

	process (callback) {
		if (this.request.params.id.toLowerCase() === 'me') {
			this.responseData = { user: this.user.getSanitizedObjectForMe() };
			return process.nextTick(callback);
		}
		super.process(callback);
	}
}

module.exports = GetUserRequest;
