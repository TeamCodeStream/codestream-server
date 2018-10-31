'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.type = this.type || 'channel';
		this.teamOptions.creatorIndex = 1;
		Object.assign(this.streamOptions, {
			creatorIndex: 1,
			type: this.type
		});
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			numPosts: 5
		});
	}

	get description () {
		return `should return the correct posts when requesting posts in a ${this.type} stream`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for our request to retrieve posts
		], callback);
	}

	// set the path to use for the fetch request
	setPath (callback) {
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}`;
		this.expectedPosts = this.postData.map(postData => postData.post);
		callback();
	}

	// validate the response to the fetch request
	validateResponse (data) {
		// we expect certain posts, and we expect their attributes are sanitized (devoid
		// of attributes that should not go to the client)
		this.validateMatchingObjects(data.posts, this.expectedPosts, 'posts');
		this.validateSanitizedObjects(data.posts, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostsTest;
