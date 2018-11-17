'use strict';

const UnreadTest = require('./unread_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class UnreadFetchTest extends UnreadTest {

	get description () {
		return 'should set lastReads for the stream of a post when post is marked as unread, as checked by fetching the me object';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		// we expect to see the usual fields for a user, plus fields only the user themselves should see
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return userResponse;
	}

	// before the test runs...
	before (callback) {
		// do standard test set up, but then do the mark unread, the actual test will be 
		// fetching the me-object
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/users/me';
			this.markUnread(callback);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// we expect to see the sequence number set to the sequence number of the previous post
		// to the post that was marked unread ... the sequence numbers are 1-based so this is 
		// just the same as the ordinal number of the post in the array of posts created
		const expectedLastReads = {
			[this.stream.id]: this.lastReadPost.seqNum
		};
		Assert.deepEqual(expectedLastReads, data.user.lastReads, 'lastReads doesn\'t match');
		super.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = UnreadFetchTest;
