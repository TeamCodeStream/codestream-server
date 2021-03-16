'use strict';

const ReadItemTest = require('./read_item_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class ReadItemFetchTest extends ReadItemTest {

	get description () {
		return 'should set lastItemsReads for the post when requested, as checked by fetching the me object';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { user: UserTestConstants.EXPECTED_USER_FIELDS };
	}

	// before the test runs...
	before (callback) {
		// do standard test set up, but then do the set item-read, the actual test will be 
		// fetching the me-object
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/users/me';
			this.setItemRead(callback);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// we expect to see the sequence number set to the sequence number of the previous post
		// to the post that was marked unread ... the sequence numbers are 1-based so this is 
		// just the same as the ordinal number of the post in the array of posts created
		const expectedLastReadItems = {
			[this.itemId.toLowerCase()]: this.numReplies
		};
		Assert.deepStrictEqual(expectedLastReadItems, data.user.lastReadItems, 'lastReadItems doesn\'t match');
		super.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = ReadItemFetchTest;
