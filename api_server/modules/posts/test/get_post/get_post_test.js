'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.type = this.type || 'channel';
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.type;
		this.repoOptions.creatorIndex = 1;
		this.postOptions.creatorIndex = this.mine ? 0 : 1;
		if (this.type === 'file') {
			this.postOptions.wantCodeBlock = true;
		}
	}

	get description () {
		let who = this.mine ? 'me' : 'another user';
		return `should return a valid post when requesting a post created by ${who} in a ${this.type} stream`;
	}

	// get the fields expected to be returned by the request being tested
	getExpectedFields () {
		let response = { post: PostTestConstants.EXPECTED_POST_FIELDS };
		if (this.type === 'file') {	// posts in a file stream have additional fields
			response.post = [...response.post, ...PostTestConstants.EXPECTED_FILE_POST_FIELDS];
		}
		return response;
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
		this.path = '/posts/' + this.post._id;
		callback();
	}

	// vdlidate the response to the request
	validateResponse (data) {
		// verify we got the right post, and that there are no attributes we don't want the client to see
		this.validateMatchingObject(this.post._id, data.post, 'post');
		this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetPostTest;
