'use strict';

var GetPostsTest = require('./get_posts_test');
var Assert = require('assert');

class GetPostsByPathTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.type = 'file';
	}

	get description () {
		return 'should return the correct posts when requesting posts in a stream that is specified by path';
	}

	// set the path to use for the request
	setPath (callback) {
		let streamPath = encodeURIComponent(this.stream.file);
		this.path = `/posts/?teamId=${this.team._id}&repoId=${this.repo._id}&path=${streamPath}`;
		callback();
	}

	// validate the response to the test request
	validateResponse (data) {
		Object.assign(this.stream, { 
			mostRecentPostId: data.stream.mostRecentPostId,
			mostRecentPostCreatedAt: data.stream.mostRecentPostCreatedAt,
			sortId: data.stream.sortId,
			numMarkers: data.stream.numMarkers
		});
		Assert.deepEqual(data.stream, this.stream, 'stream is incorrect');
		super.validateResponse(data);
	}
}

module.exports = GetPostsByPathTest;
