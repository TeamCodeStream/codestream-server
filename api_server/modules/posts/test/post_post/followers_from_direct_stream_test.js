'use strict';

const CodemarkTest = require('./codemark_test');

class FollowersFromDirectStreamTest extends CodemarkTest {

	get description () {
		return 'should return a valid post and codemark with the stream members as follower IDs when creating a post with a codemark in a direct stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 5;
			this.streamOptions.type = 'direct';
			this.streamOptions.members = [0, 3];
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.expectedFollowerIds = [
				this.currentUser.user.id,
				this.users[1].user.id,
				this.users[3].user.id
			];
			callback();
		});
	}
}

module.exports = FollowersFromDirectStreamTest;
