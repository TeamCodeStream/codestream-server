'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PostTestConstants = require('../post_test_constants');

class GetPostTest extends CodeStreamAPITest {

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
			this.createOtherUser,	// create another user
			this.createRandomRepo,	// create a repo (and team)
			this.createStream,		// create a stream in the team
			this.createPost,		// create a post in the stream
			this.setPath			// set the path for the request
		], callback);
	}

	// create another user so we're not doing everything ourselves!
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a random repo, which will also create a team
	createRandomRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				callback();
			},
			{
				withRandomEmails: 2,	// add a few random users
				withEmails: this.withoutMe ? null : [this.currentUser.email], // with me or without me depending on the test
				token: this.otherUserData.accessToken	// the "other" user is the creator
			}
		);
	}

	// create a random stream according to the specific test
	createStream (callback) {
		let streamOptions = {
			type: this.type,	// channel, direct, file
			token: this.mine ? this.token : this.otherUserData.accessToken, // by me or the "other" user, depending on the test
			teamId: this.repo.teamId,
			repoId: this.type === 'file' ? this.repo._id : null, // must have a repo ID for file-type streams
		};
		if (this.type !== 'file' && !this.mine && !this.withoutMe) {
			// include me in channel/direct streams, unless told not to
			streamOptions.memberIds = [this.currentUser._id];
		}
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a random post in the stream
	createPost (callback) {
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			{
				token: this.mine ? this.token : this.otherUserData.accessToken, // creator is me or the "other" user
				streamId: this.stream._id,
				wantCodeBlocks: this.type === 'file' ? 1 : false,	// we'll always do a code block if it's in a file-type stream
				wantCommitHash: this.type === 'file'	// want a commit hash if this is a file-type stream
			}
		);
	}

	// set the path to use for this request
	setPath (callback) {
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
