'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			numPosts: 5
		});
	}

	get description () {
		const type = this.type || 'team';
		return `should return the correct posts when requesting posts in a ${type} stream`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.wait1sec,
			this.logPosts,
			this.setPath			// set the path for our request to retrieve posts
		], callback);
	}

	wait1sec (callback) {
		// this ensures the "repo post", if any, has a timestamp less than any of the other posts created
		setTimeout(callback, 1000);
	}

	logPosts (callback) {
		this.testLog(`CREATED: ${this.postData.map(postData => postData.post.id)}`);
		callback();
	}
	
	// set the path to use for the fetch request
	setPath (callback) {
		this.path = `/posts?teamId=${this.team.id}` //&streamId=${this.teamStream.id}`;
		this.expectedPosts = this.postData.map(postData => postData.post);
		callback();
	}

	// validate the response to the fetch request
	validateResponse (data) {
		this.testLog(`EXPECTED: ${this.expectedPosts.map(post => post.id)}`);
		this.testLog(`GOT: ${data.posts.map(post => post.id)}`);
		// we expect certain posts, and we expect their attributes are sanitized (devoid
		// of attributes that should not go to the client)
		this.validateMatchingObjects(data.posts, this.expectedPosts, 'posts');
		this.validateSanitizedObjects(data.posts, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostsTest;
