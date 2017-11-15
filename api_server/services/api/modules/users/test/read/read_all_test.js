'use strict';

var ReadTest = require('./read_test');
const UserTestConstants = require('../user_test_constants');

class ReadAllTest extends ReadTest {

	get description () {
		return 'should clear all of lastReads for the current user when requested';
	}

	getExpectedFields () {
		let meFields = [...UserTestConstants.EXPECTED_ME_FIELDS];
		let index = meFields.indexOf('lastReads');
		if (index !== -1) {
			meFields.splice(index);
		}
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...meFields];
		return userResponse;
	}

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

	validateResponse (data) {
		this.validateSanitized(data.user);
	}
}

module.exports = ReadAllTest;
