'use strict';

const CodeErrorTest = require('./code_error_test');

class FollowCodeErrorByPreferenceMentionTest extends CodeErrorTest {

	get description () {
		return 'when a code error is created and mentions a user who has a preference to follow code errors involving them, the mentioned user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds = [this.users[1].user.id];
			this.expectedFollowerIds = [this.currentUser.user.id, this.users[1].user.id];
			this.setNotificationPreference('involveMe', 1, callback);
		});
	}
}

module.exports = FollowCodeErrorByPreferenceMentionTest;
