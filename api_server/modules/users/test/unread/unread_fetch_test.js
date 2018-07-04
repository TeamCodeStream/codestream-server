'use strict';

const UnreadTest = require('./unread_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');

class UnreadFetchTest extends UnreadTest {

	constructor (options) {
		super(options);
		this.withoutMeOnTeam = true;
	}
	
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
		let expectedLastReads = {
			[this.stream._id]: this.unreadPost.toString()
		};
		Assert.deepEqual(expectedLastReads, data.user.lastReads, 'lastReads doesn\'t match');
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

module.exports = UnreadFetchTest;
