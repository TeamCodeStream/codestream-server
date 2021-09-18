'use strict';

const PostReplyTest = require('../post_reply_test');

class CodeErrorReplyToAttachedCodemarkTest extends PostReplyTest {

	get description () {
		return 'should be ok to reply to a codemark that is a reply to a code error';
	}

	setTestOptions (callback) {
		this.expectedSeqNum = 4;
		this.expectedStreamVersion = 5;
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				wantCodeError: true
			});
			callback();
		});
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			const codemarkData = this.codemarkFactory.getRandomCodemarkData();
			this.doApiRequest(
				{
					method: 'post',
					path: '/posts',
					data: {
						streamId: this.teamStream.id,
						parentPostId: this.postData[0].post.id,
						codemark: codemarkData
					},
					token: this.token
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.data.parentPostId = response.post.id;
					callback();
				}
			);
		});
	}
}

module.exports = CodeErrorReplyToAttachedCodemarkTest;
