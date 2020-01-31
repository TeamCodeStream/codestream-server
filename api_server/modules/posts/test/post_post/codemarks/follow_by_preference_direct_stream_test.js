'use strict';

const CodemarkTest = require('./codemark_test');

class FollowByPreferenceDirectStreamTest extends CodemarkTest {

	constructor (options) {
		super(options);
		this.streamOptions.type = 'direct';
		this.streamOptions.members = [0];
	}

	get description () {
		return 'when a codemark is created in a DM with a user who has a preference to follow codemarks involving them, the other user should be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id, this.users[1].user.id];
			this.setNotificationPreference('involveMe', 1, callback);
		});
	}
}

module.exports = FollowByPreferenceDirectStreamTest;
