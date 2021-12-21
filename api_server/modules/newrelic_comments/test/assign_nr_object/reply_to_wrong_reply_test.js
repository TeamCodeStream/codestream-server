'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ReplyToWrongReplyTest extends CreateNRCommentTest {

	get description () {
		return 'should return an error when trying to reply to a reply to an NR object that does not match the object submitted with the reply';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				wantCodeError: true
			});
			callback();
		});
	}

	getExpectedError () {
		return {
			code: 'POST-1007',
			reason: 'the parent post is a reply to an object that does not match the object referenced in the submitted reply'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createReplyToWrongCodeError
		], callback);
	}

	createReplyToWrongCodeError (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		const codeError = this.postData[0].codeError;
		Object.assign(data, {
			objectId: codeError.objectId,
			objectType: codeError.objectType,
			accountId: codeError.accountId,
			parentPostId: codeError.postId
		});
		
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.parentPostId = response.post.id;
				callback();
			}
		);
	}
}

module.exports = ReplyToWrongReplyTest;
