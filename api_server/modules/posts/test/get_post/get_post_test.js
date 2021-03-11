'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		// posting to channels other than the team stream is no longer supported,
		// so disable any possibility of posting elsewhere
		//this.type = this.type || 'channel';
		//this.streamOptions.creatorIndex = 1;
		//this.streamOptions.type = this.type;
		this.postOptions.creatorIndex = this.mine ? 0 : 1;
	}

	get description () {
		let who = this.mine ? 'me' : 'another user';
		const type = this.type || 'team';
		return `should return a valid post when requesting a post created by ${who} in a ${type} stream`;
	}

	// get the fields expected to be returned by the request being tested
	getExpectedFields () {
		return { post: PostTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for the request
		], callback);
	}

	// set the path to use for this request
	setPath (callback) {
		this.post = this.postData[0].post;
		this.path = '/posts/' + this.post.id;
		callback();
	}

	// vdlidate the response to the request
	validateResponse (data) {
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post.id, data.post, 'post');
		this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostTest;
