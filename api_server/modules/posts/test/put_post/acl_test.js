'use strict';

var PutPostTest = require('./put_post_test');

class ACLTest extends PutPostTest {

	get description () {
		return 'should return an error when trying to update a post authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the post author can edit the post'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// replace the current user's token with the other user's token
			this.token = this.otherUserData.accessToken;
			callback();
		});
	}
}

module.exports = ACLTest;
