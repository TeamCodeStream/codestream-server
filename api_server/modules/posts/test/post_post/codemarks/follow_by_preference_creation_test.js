'use strict';

const CodemarkTest = require('./codemark_test');

class FollowByPreferenceCreationTest extends CodemarkTest {

	get description () {
		return 'when a codemark is created and the creator has a preference to follow codemarks involving them, the user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.setNotificationPreference('involveMe', 0, callback);
		});
	}
}

module.exports = FollowByPreferenceCreationTest;
