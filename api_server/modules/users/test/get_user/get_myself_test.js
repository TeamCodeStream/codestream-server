'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const UserTestConstants = require('../user_test_constants');

class GetMyselfTest extends CodeStreamAPITest {

	get description () {
		return 'should return myself when requesting myself' + (this.id ? ' by id' : '');
	}

	getExpectedFields () {
		return UserTestConstants.EXPECTED_USER_RESPONSE;
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// we'll fetch "ourselves", either by literal ID, or by "me" in the path
			this.path = '/users/' + (this.id || this.currentUser.user._id);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back "ourselves", and that there are no attributes a client shouldn't see
		this.validateMatchingObject(this.currentUser.user._id, data.user, 'user');
		const attributes = this.id === 'me' ? UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME : UserTestConstants.UNSANITIZED_ATTRIBUTES;
		this.validateSanitized(data.user, attributes);
	}
}

module.exports = GetMyselfTest;
