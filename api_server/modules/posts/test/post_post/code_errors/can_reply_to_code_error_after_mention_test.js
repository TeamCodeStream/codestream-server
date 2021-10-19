'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');
const RandomString = require('randomstring');

class CanReplyToCodeErrorAfterMentionTest extends CodeErrorReplyTest {

	get description () {
		return 'once a user is mentioned in a reply to a code error, that user can then reply to the code error';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.mentionUserInReply(callback);
		});
	}

	// mention the current user in a reply, so their reply will work
	mentionUserInReply (callback) {
		this.expectedSeqNum++;
		this.expectedStreamVersion++;
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: {
					streamId: this.postData[0].codeError.streamId,
					text: RandomString.generate(100),
					mentionedUserIds: [this.currentUser.user.id],
					parentPostId: this.postData[0].post.id
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = CanReplyToCodeErrorAfterMentionTest;
