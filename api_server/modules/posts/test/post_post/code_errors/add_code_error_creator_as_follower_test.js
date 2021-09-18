'use strict';

const AddCodeErrorFollowersTest = require('./add_code_error_followers_test');

class AddCodeErrorCreatorAsFollowerTest extends AddCodeErrorFollowersTest {

	get description () {
		return 'when adding a creator as the follower of a code error created with a post, creator ID should not get added twice';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeError.followerIds.push(this.currentUser.user.id);
			callback();
		});
	}
}

module.exports = AddCodeErrorCreatorAsFollowerTest;
