'use strict';

const CodeErrorTest = require('./code_error_test');

class NoFollowAllCodeErrorsByPreference extends CodeErrorTest {

	get description () {
		return 'when a code error is created and a user has notification preferences off, user should be not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('off', 1, callback);
		});
	}
}

module.exports = NoFollowAllCodeErrorsByPreference;
