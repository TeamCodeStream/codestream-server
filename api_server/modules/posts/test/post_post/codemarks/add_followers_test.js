'use strict';

const CodemarkTest = require('./codemark_test');

class AddFollowersTest extends CodemarkTest {

	get description () {
		return 'should return a valid post and codemark with correct follower IDs when creating a post with a codemark with an array of followers';
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
			this.data.codemark.followerIds = [
				this.users[2].user.id,
				this.users[4].user.id
			];
			this.expectedFollowerIds = [this.currentUser.user.id, ...this.data.codemark.followerIds];
			callback();
		});
	}
}

module.exports = AddFollowersTest;
