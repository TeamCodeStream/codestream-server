'use strict';

const CodemarkTest = require('./codemark_test');

class FollowByPreferenceMentionTest extends CodemarkTest {

	get description () {
		return 'when a codemark is created and mentions a user who has a preference to follow codemarks involving them, the mentioned user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.mentionedUserIds = [this.users[1].user.id];
			this.expectedFollowerIds = [this.currentUser.user.id, this.users[1].user.id];
			this.setNotificationPreference('involveMe', 1, callback);
		});
	}
}

module.exports = FollowByPreferenceMentionTest;
