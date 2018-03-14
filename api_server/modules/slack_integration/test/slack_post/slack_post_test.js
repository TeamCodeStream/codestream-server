'use strict';

var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var CommonInit = require('./common_init');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Assert = require('assert');
const PostTestConstants = require(process.env.CS_API_TOP + '/modules/posts/test/post_test_constants');
const StreamTestConstants = require(process.env.CS_API_TOP + '/modules/streams/test/stream_test_constants');
const RepoTestConstants = require(process.env.CS_API_TOP + '/modules/repos/test/repo_test_constants');

class SlackPostTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.ignoreTokenOnRequest = true; // the actual test request should be anonymous
	}

	get description () {
		return 'should create and return a post when a slack post call is made';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/slack-post';
	}

	getExpectedFields () {
		return {
			post: PostTestConstants.EXPECTED_POST_FIELDS,
			parentPost: PostTestConstants.EXPECTED_POST_FIELDS,
			repo: RepoTestConstants.EXPECTED_REPO_FIELDS,
			stream: [...StreamTestConstants.EXPECTED_STREAM_FIELDS, ...StreamTestConstants.EXPECTED_FILE_STREAM_FIELDS]
		};
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we got back a post with the attributes we specified
		let post = data.post;
		let errors = [];
		let author = this.createdAuthor || this.postOriginatorData.user;
		let result = (
			((post.text === this.data.text) || errors.push('text does not match')) &&
			((post.teamId === this.team._id) || errors.push('teamId does not match the team')) &&
			((post.repoId === this.repo._id) || errors.push('repoId does not match the repo')) &&
			((post.streamId === this.stream._id) || errors.push('streamId does not match')) &&
			((post.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof post.createdAt === 'number') || errors.push('createdAt not number')) &&
			((post.modifiedAt >= post.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((post.creatorId === author._id) || errors.push('creatorId not equal to the post originator ID')) &&
			((post.origin === 'slack') || errors.push('origin is not slack'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = SlackPostTest;
