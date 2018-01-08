'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class GetMyselfTest extends CodeStreamAPITest {

	get description () {
		return 'should return myself when requesting myself' + (this.id ? ' by id' : '');
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	before (callback) {
		this.path = '/users/' + (this.id || this.currentUser._id);
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.currentUser._id, data.user, 'user');
		this.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetMyselfTest;
