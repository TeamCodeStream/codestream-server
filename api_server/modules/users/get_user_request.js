'use strict';

var GetRequest = require(process.env.CS_API_TOP + '/lib/util/restful/get_request');

class GetUserRequest extends GetRequest {

	process (callback) {
		if (this.request.params.id.toLowerCase() === 'me') {
			let meOnlyAttributes = this.user.getMeOnlyAttributes();
			this.responseData = { user: this.user.getSanitizedObject() };
			Object.assign(this.responseData.user, meOnlyAttributes);
			return process.nextTick(callback);
		}
		super.process(callback);
	}
}

module.exports = GetUserRequest;
