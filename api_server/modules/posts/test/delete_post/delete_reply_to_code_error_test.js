'use strict';

const DeletePostTest = require('./delete_post_test');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');
const CodeErrorTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/code_errors/test/code_error_test_constants');

class DeleteReplyToCodeErrorTest extends DeletePostTest {

	get description () {
		return 'should delete associated reply to a code error when requested';
	}

	setTestOptions (callback) {
		this.testPost = 2;
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions, {
				numPosts: 4,
				postData: [{
					wantCodeError: true
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
		const codeErrorPost = this.postData[0];
		super.setExpectedData(() => {
			this.expectedData.codeErrors = [{
				_id: codeErrorPost.codeError.id, // DEPRECATE ME
				id: codeErrorPost.codeError.id, 
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
				_id: codeErrorPost.post.id, // DEPRECATE ME
				id: codeErrorPost.post.id, 
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
		const codeError = data.codeErrors[0];
		Assert(codeError.$set.modifiedAt >= this.modifiedAfter, 'codeError modifiedAt is not greater than before the post was deleted');
		this.expectedData.codeErrors[0].$set.modifiedAt = codeError.$set.modifiedAt;
		const parentPost = data.posts[1];
		Assert(parentPost.$set.modifiedAt >= this.modifiedAfter, 'parent post modifiedAt is not greater than before the post was deleted');
		this.expectedData.posts[1].$set.modifiedAt = parentPost.$set.modifiedAt;
		this.validateSanitized(codeError.$set, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(parentPost.$set, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeleteReplyToCodeErrorTest;
