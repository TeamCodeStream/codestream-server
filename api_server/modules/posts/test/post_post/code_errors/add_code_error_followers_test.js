'use strict';

const CodeErrorTest = require('./code_error_test');

class AddCodeErrorFollowersTest extends CodeErrorTest {

	get description () {
		return 'should return a valid post and code error with correct follower IDs when creating a post with a code error with an array of followers';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 5;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// add some followers
			this.data.codeError.followerIds = [
				this.users[2].user.id,
				this.users[4].user.id
			];
			this.expectedFollowerIds = [this.currentUser.user.id, ...this.data.codeError.followerIds];
			callback();
		});
	}
}

module.exports = AddCodeErrorFollowersTest;
