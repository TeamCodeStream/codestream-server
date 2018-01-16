'use strict';

var RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request');

class GetPreferencesRequest extends RestfulRequest {

	authorize (callback) {
		return callback();
	}

	process (callback) {
		this.responseData.preferences = this.request.user.get('preferences') || {};
		callback();
	}
}

module.exports = GetPreferencesRequest;
