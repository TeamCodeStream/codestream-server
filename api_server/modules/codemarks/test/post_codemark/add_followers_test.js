'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class AddFollowersTest extends PostCodemarkTest {

	get description () {
		return 'should return a valid codemark with correct follower IDs when creating a codemark with an array of followers';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 5;
			callback();
		});
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			// add some followers
			this.data.followerIds = [
				this.users[2].user.id,
				this.users[4].user.id
			];
			this.expectedFollowerIds = [this.currentUser.user.id, ...this.data.followerIds];
			callback();
		});
	}
}

module.exports = AddFollowersTest;
