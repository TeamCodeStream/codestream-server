'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class UpdateReplyTest extends UpdateNRCommentTest {

	get description () {
		return 'should return a New Relic comment when an update is made through the comment engine, when the updated comment is a reply to another comment';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.replyToComment(callback);
		});
	}

	// claim code error for the current team
	replyToComment (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		const { objectId, objectType, accountId, id } = this.nrCommentResponse.post;
		Object.assign(data, {
			objectId,
			objectType,
			accountId,
			parentPostId: id
		});

		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data: data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.path = '/nr-comments/' + response.post.id;
				this.expectedResponse = {
					post: Object.assign(DeepClone(response.post), {
						version: 2,
						modifiedAt: Date.now(), // placeholder
						...data
					}, {
						...this.data
					})
				};
				this.expectedResponse.post.creator.username = this.expectedResponse.post.creator.email.split('@')[0];
				this.updatedAfter = Date.now();
				callback();
			}
		);

	}
}

module.exports = UpdateReplyTest;
