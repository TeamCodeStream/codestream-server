'use strict';

const BumpPostsTest = require('./bump_posts_test');
const Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class BumpPostsFetchTest extends BumpPostsTest {

	get description () {
		return 'should increment totalPosts for the user when requested, as checked by fetching the me object';
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
		// do standard test set up, but then bump the posts, the actual test will be 
		// fetching the me-object
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data;
			this.path = '/users/me';
			this.bumpPosts(callback);
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// totalPosts should be numPosts + 1
		Assert.equal(data.user.totalPosts, this.numPosts + 1, 'totalPosts not correct');
		super.validateSanitized(data.user, UserTestConstants.UNSANITIZED_ATTRIBUTES_FOR_ME);
	}
}

module.exports = BumpPostsFetchTest;
