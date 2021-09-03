'use strict';

const CodeErrorTest = require('./code_error_test');

class NoFollowCodeErrorCreationByPreferenceTest extends CodeErrorTest {

	get description () {
		return 'when a code error is created and the creator has notification preferences turned off, the user should not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [];
			this.setNotificationPreference('off', 0, callback);
		});
	}
}

module.exports = NoFollowCodeErrorCreationByPreferenceTest;
