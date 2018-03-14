'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ReadACLTest extends CodeStreamAPITest {

	get description () {
		return 'should return error when user attempts to mark a stream read when that user is not a member of the stream';
	}

	get method () {
		return 'put';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo,		// have that user create a repo (and team)
			this.createStream,		// have that user create a stream in the repo
			this.createPost			// have that user create a post in the stream
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (which creates a team)
	createRepo (callback) {
		// in creating the repo, we are omitting the "current" user, so they will
		// have an ACL failure trying to set a "read" status for the stream
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// "other" user creates the repo/team
			}
		);
	}

	// create a file-type stream in the repo
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken	// "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				this.path = '/read/' + this.stream._id;	// we'll set this stream to "read" for the current user
				callback();
			},
			streamOptions
		);
	}

	// create a post in the stream we created
	createPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// "other" user creates the post
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			postOptions
		);
	}
}

module.exports = ReadACLTest;
