'use strict';

const CodemarkTest = require('./codemark_test');

class NoFollowMentionByPreferenceTest extends CodemarkTest {

	get description () {
		return 'when a codemark is created and mentions a user who has notification preferences turned off, the mentioned user should not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds = [this.users[1].user.id];
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('off', 1, callback);
		});
	}
}

module.exports = NoFollowMentionByPreferenceTest;
