'use strict';

const CodemarkTest = require('./codemark_test');

class NoFollowDirectStreamByPreferenceTest extends CodemarkTest {

	constructor (options) {
		super(options);
		this.streamOptions.type = 'direct';
		this.streamOptions.members = [0];
	}

	get description () {
		return 'when a codemark is created in a DM with a user who has notification preferences turned off, the other user should not be added as a follower';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [this.currentUser.user.id];
			this.setNotificationPreference('off', 1, callback);
		});
	}
}

module.exports = NoFollowDirectStreamByPreferenceTest;
