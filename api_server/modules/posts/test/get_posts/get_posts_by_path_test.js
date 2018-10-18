'use strict';

const GetPostsTest = require('./get_posts_test');
const Assert = require('assert');

class GetPostsByPathTest extends GetPostsTest {

	constructor (options) {
		options = Object.assign(options || {}, { type: 'file' });
		super(options);
	}

	get description () {
		return 'should return the correct posts when requesting posts in a stream that is specified by path';
	}

	// set the path to use for the request
	setPath (callback) {
		const streamPath = encodeURIComponent(this.stream.file);
		this.path = `/posts/?teamId=${this.team._id}&repoId=${this.repo._id}&path=${streamPath}`;
		this.expectedPosts = this.postData.map(postData => postData.post);
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		Object.assign(this.stream, { 
			mostRecentPostId: data.stream.mostRecentPostId,
			mostRecentPostCreatedAt: data.stream.mostRecentPostCreatedAt,
			sortId: data.stream.sortId,
			version: data.stream.version
		});
		Assert.deepEqual(data.stream, this.stream, 'stream is incorrect');
		super.validateResponse(data);
	}
}

module.exports = GetPostsByPathTest;
