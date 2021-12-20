'use strict';

const MentionsTest = require('./mentions_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class MentionedRegisteredUserTest extends MentionsTest {

	get description () {
		return 'when creating a New Relic comment, recognize by email any registered users';
	}

	makeNRCommentData (callback) {
		// add mentions to the test data
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			this.data.mentionedUsers[1] = {
				email: this.users[0].user.email
			};
			this.expectedResponse.post.mentionedUsers = DeepClone(this.data.mentionedUsers);
			Object.assign(this.expectedResponse.post.mentionedUsers[1], {
				fullName: this.users[0].user.fullName,
				username: this.users[0].user.username
			});
			callback();
		});
	}
}

module.exports = MentionedRegisteredUserTest;
