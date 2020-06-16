'use strict';

const AddFollowersTest = require('./add_followers_test');

class AddCreatorAsFollowerTest extends AddFollowersTest {

	get description () {
		return 'when adding a creator as the follower of a codemark, creator ID should not get added twice';
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			this.data.followerIds.push(this.currentUser.user.id);
			callback();
		});
	}
}

module.exports = AddCreatorAsFollowerTest;
