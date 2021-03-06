'use strict';

const DeletePostTest = require('./delete_post_test');
const Assert = require('assert');

class NumRepliesTest extends DeletePostTest {

	get description () {
		return 'should decrement numReplies for the parent post when the child post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				numPosts: 4,
				postData: [{}, { replyTo: 0 }, { replyTo: 0 }, { replyTo: 0 }]
			});
			this.testPost = 2;
			callback();
		});
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			this.expectedData.posts.push({
				_id: this.postData[0].post.id,	// DEPRECATE ME
				id: this.postData[0].post.id,
				$set: {
					numReplies: 2,
					version: 5
				},
				$version: {
					before: 4,
					after: 5
				}
			});
			this.updatedAt = Date.now();
			callback();
		});
	}

	validateResponse (data) {
		const dataPost = data.posts.find(post => post.id === this.postData[0].post.id);
		Assert(dataPost.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		const expectedPost = this.expectedData.posts.find(post => post.id === this.postData[0].post.id);
		expectedPost.$set.modifiedAt = dataPost.$set.modifiedAt;
		return super.validateResponse(data);
	}
}

module.exports = NumRepliesTest;
