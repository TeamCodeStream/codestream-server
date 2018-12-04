'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');
const CodemarkTestConstants = require('../codemark_test_constants');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const Assert = require('assert');

class DeletePostTest extends DeleteCodemarkTest {

	get description () {
		return 'should return the deactivated codemark and post when deleting a codemark attached to a post';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.wantPost = true;
			this.testPost = 0;
			this.streamOptions.creatorIndex = 1;
			if (this.streamType === 'team stream') {
				Object.assign(this.streamOptions, {
					type: 'channel',
					isTeamStream: true
				});
			}
			else {
				this.streamOptions.type = this.streamType || 'channel';
			}
			this.postOptions.creatorIndex = 0;
			this.postOptions.wantCodemark = true;
			callback();
		});
	}

	setExpectedData (callback) {
		const postData = this.postData[this.testPost];
		super.setExpectedData(() => {
			this.expectedData.posts = [{
				_id: postData.post.id,	// DEPRECATE ME
				id: postData.post.id,
				$set: {
					deactivated: true,
					text: 'this post has been deleted',
					modifiedAt: Date.now(),	// placeholder
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
			this.expectedPost = DeepClone(postData.post);
			Object.assign(this.expectedPost, this.expectedData.posts[0].$set);
			callback();
		});
	}

	validateResponse (data) {
		const post = data.posts[0];
		Assert(post.$set.modifiedAt > this.modifiedAfter, 'codemark modifiedAt is not greater than before the post was deleted');
		this.expectedData.posts[0].$set.modifiedAt = post.$set.modifiedAt;
		this.validateSanitized(post.$set, CodemarkTestConstants.UNSANITIZED_POST_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeletePostTest;
