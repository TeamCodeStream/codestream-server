'use strict';

const CodeErrorTest = require('./code_error_test');

class FollowCodeErrorByPreferenceCreationTest extends CodeErrorTest {

	get description () {
		return 'when a code error is created and the creator has a preference to follow codemarks and reviews involving them, the user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('involveMe', 0, callback);
		});
	}
}

module.exports = FollowCodeErrorByPreferenceCreationTest;
