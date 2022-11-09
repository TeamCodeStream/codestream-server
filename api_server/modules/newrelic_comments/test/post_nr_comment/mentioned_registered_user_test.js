'use strict';

const MentionsTest = require('./mentions_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');

class MentionedRegisteredUserTest extends MentionsTest {

	get description () {
		return 'when creating a New Relic comment, recognize by email any registered users';
	}

	makeNRCommentData (callback) {
		// add mentions to the test data
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			const user = this.users[0].user;
			this.data.mentionedUsers[1] = {
				email: user.email
			};
			this.expectedResponse.post.mentionedUsers = DeepClone(this.data.mentionedUsers);
/*
			Object.assign(this.expectedResponse.post.mentionedUsers[1], {
				fullName: user.fullName,
				username: user.username
			});
*/
			if (!this.oneUserPerOrg) { // ONE_USER_PER_ORG
				Object.assign(this.expectedResponse.post.mentionedUsers[1], {
					fullName: user.fullName,
					username: user.username
				});
			} else {
				Object.assign(this.expectedResponse.post.mentionedUsers[1], {
					fullName: '',
					username: EmailUtilities.parseEmail(user.email).name
				});
			}
			callback();
		});
	}
}

module.exports = MentionedRegisteredUserTest;
