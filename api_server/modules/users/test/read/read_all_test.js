'use strict';

var ReadTest = require('./read_test');
const UserTestConstants = require('../user_test_constants');

class ReadAllTest extends ReadTest {

	get description () {
		return 'should clear all of lastReads for the current user when requested';
	}

	getExpectedFields () {
		// when fetching our me-object, since we're doing /read/all, that wipes the
		// lastReads object, so we don't expect to see that field
		let meFields = [...UserTestConstants.EXPECTED_ME_FIELDS];
		let index = meFields.indexOf('lastReads');
		if (index !== -1) {
			meFields.splice(index);
		}
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...meFields];
		return userResponse;
	}

	// mark all streams as read
	markRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/all',
				token: this.token
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate we don't see any attributes a client shouldn't see
		this.validateSanitized(data.user);
	}
}

module.exports = ReadAllTest;
