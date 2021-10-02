'use strict';

const CodeErrorTest = require('./code_error_test');

class DontFollowCodeErrorByPreferenceAllTest extends CodeErrorTest {

	get description () {
		return 'when a code error is created and a user has a preference to follow all codemarks and reviews created on the team, user should NOT be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('all', 1, callback);
		});
	}
}

module.exports = DontFollowCodeErrorByPreferenceAllTest;
