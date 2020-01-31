'use strict';

const AddFollowersTest = require('./add_followers_test');

class AddCreatorAsFollowerTest extends AddFollowersTest {

	get description () {
		return 'when adding a creator as the follower of a codemark created with a post, creator ID should not get added twice';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codemark.followerIds.push(this.currentUser.user.id);
			callback();
		});
	}
}

module.exports = AddCreatorAsFollowerTest;
