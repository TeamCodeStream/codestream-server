'use strict';

const FollowCodeErrorWhenMentionedTest = require('./follow_code_error_when_mentioned_test');

class FollowCodeErrorWhenMentionedDespitePreferenceTest extends FollowCodeErrorWhenMentionedTest {

	get description () {
		return 'when a reply to a code error mentions a user, the mentioned user should be added as a follower even if they have a preference not to follow codemarks or reviews';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.setNotificationPreference('off', 1, callback);
		});
	}
}

module.exports = FollowCodeErrorWhenMentionedDespitePreferenceTest;
