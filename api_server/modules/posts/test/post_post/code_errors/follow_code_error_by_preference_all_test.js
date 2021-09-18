'use strict';

const CodeErrorTest = require('./code_error_test');

class FollowCodeErrorByPreferenceAllTest extends CodeErrorTest {

	get description () {
		return 'when a code error is created and a user has a preference to follow all code errors created on the team, user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.users[1].user.id, this.currentUser.user.id];
			this.setNotificationPreference('all', 1, callback);
		});
	}
}

module.exports = FollowCodeErrorByPreferenceAllTest;
