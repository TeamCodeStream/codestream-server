'use strict';

const ReadAllTest = require('./read_all_test');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');

class ReadAllFetchTest extends ReadAllTest {

	get description () {
		return 'should clear lastReads for the stream, as checked by fetching the me object';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		// when fetching our me-object, since we're doing /read/all, that wipes the
		// lastReads object, so we don't expect to see that field
		const meFields = [...UserTestConstants.EXPECTED_ME_FIELDS];
		const index = meFields.indexOf('lastReads');
		if (index !== -1) {
			meFields.splice(index);
		}
		const userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...meFields];
		return userResponse;
	}

	// before the test runs...
	before (callback) {
		// do standard test set up, but then do the mark read, the actual test will be 
		// fetching the me-object
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/users/me';
			this.markReadAll(callback);
		});
	}

	// mark all streams as read
	markReadAll (callback) {
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
		this.validateSanitized(data.user);
	}

	// validate that the response has no attributes that should not be sent to clients
	validateSanitized (user, fields) {
		// the base-clase validation doesn't know to avoid looking for me-only attributes,
		// so remove those from the fields we'll be checking against
		fields = fields || UserTestConstants.UNSANITIZED_ATTRIBUTES;
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validateSanitized(user, fields);
	}
}

module.exports = ReadAllFetchTest;
