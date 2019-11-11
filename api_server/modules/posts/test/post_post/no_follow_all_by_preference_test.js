'use strict';

const CodemarkTest = require('./codemark_test');

class NoFollowAllByPreference extends CodemarkTest {

	get description () {
		return 'when a codemark is created and a user has notification preferences off, user should be not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('off', 1, callback);
		});
	}
}

module.exports = NoFollowAllByPreference;
