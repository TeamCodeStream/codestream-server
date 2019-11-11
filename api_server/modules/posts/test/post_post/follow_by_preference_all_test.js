'use strict';

const CodemarkTest = require('./codemark_test');

class FollowByPreferenceAllTest extends CodemarkTest {

	get description () {
		return 'when a codemark is created and a user has a preference to follow all codemarks created on the team, user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.users[1].user.id, this.currentUser.user.id];
			this.setNotificationPreference('all', 1, callback);
		});
	}
}

module.exports = FollowByPreferenceAllTest;
