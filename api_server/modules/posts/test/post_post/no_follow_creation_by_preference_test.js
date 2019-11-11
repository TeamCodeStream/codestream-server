'use strict';

const CodemarkTest = require('./codemark_test');

class NoFollowCreationByPreferenceTest extends CodemarkTest {

	get description () {
		return 'when a codemark is created and the creator has notification preferences turned off, the user should not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [];
			this.setNotificationPreference('off', 0, callback);
		});
	}
}

module.exports = NoFollowCreationByPreferenceTest;
