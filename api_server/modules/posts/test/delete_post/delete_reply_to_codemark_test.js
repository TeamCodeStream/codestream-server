'use strict';

const DeletePostTest = require('./delete_post_test');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DeleteReplyToCodemarkTest extends DeletePostTest {

	get description () {
		return 'should delete associated reply to a codemark when requested';
	}

	setTestOptions (callback) {
		this.testPost = 2;
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 4,
				postData: [{
					wantCodemark: true
				}, {
					replyTo: 0
				}, {
					replyTo: 0
				}, {
					replyTo: 0
				}]
			});
			callback();
		});
	}

	setExpectedData (callback) {
		const codemarkPost = this.postData[0];
		super.setExpectedData(() => {
			this.expectedData.codemarks = [{
				_id: codemarkPost.codemark.id, // DEPRECATE ME
				id: codemarkPost.codemark.id, 
				$set: {
					modifiedAt: Date.now(), // placeholder
					numReplies: 2,
					version: 5
				},
				$version: {
					after: 5,
					before: 4
				}
			}];
			this.expectedData.posts.push({
				_id: codemarkPost.post.id, // DEPRECATE ME
				id: codemarkPost.post.id, 
				$set: {
					modifiedAt: Date.now(), // placeholder
					numReplies: 2,
					version: 5
				},
				$version: {
					after: 5,
					before: 4
				}
			})
			callback();
		});
	}

	validateResponse (data) {
		const codemark = data.codemarks[0];
		Assert(codemark.$set.modifiedAt >= this.modifiedAfter, 'codemark modifiedAt is not greater than before the post was deleted');
		this.expectedData.codemarks[0].$set.modifiedAt = codemark.$set.modifiedAt;
		const parentPost = data.posts[1];
		Assert(parentPost.$set.modifiedAt >= this.modifiedAfter, 'parent post modifiedAt is not greater than before the post was deleted');
		this.expectedData.posts[1].$set.modifiedAt = parentPost.$set.modifiedAt;
		this.validateSanitized(codemark.$set, PostTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);
		this.validateSanitized(parentPost.$set, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeleteReplyToCodemarkTest;
