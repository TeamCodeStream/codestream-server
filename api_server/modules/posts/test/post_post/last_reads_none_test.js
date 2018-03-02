'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class LastReadsNoneTest extends CodeStreamAPITest {

	get description () {
		return `last read attribute for members of the stream should get updated to "0" when a new post is created in a ${this.type} stream and those members have not read any posts in the stream yet`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create the user who will create a team
			this.createOtherUser,	// create another user
			this.createRepo,		// create a repo (which will also create a team)
			this.createStream,		// create a stream in the repo or team
			this.createPosts		// create some posts in the stream
		], callback);
	}

	get method () {
		return 'get';
	}

	get path () {
		// the test is to check the lastReads attribute for the stream, which we
		// get when we fetch the user's own user object
		return '/users/me';
	}

	getExpectedFields () {
		return { user: ['lastReads'] };
	}

	// create the user who will create the team for the test
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create another user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (which will create a team)
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email, this.otherUserData.user.email],	// put me and the other user in the team
				token: this.teamCreatorData.accessToken	// the "team creator" creates the team
			}
		);
	}

	// create a stream in the team we created
	createStream (callback) {
		let streamOptions = {
			type: this.type,
			teamId: this.team._id,
			repoId: this.type === 'file' ? this.repo._id : null,	// file-type streams need a repo ID
			memberIds: this.type === 'file' ? null : [this.currentUser._id, this.otherUserData.user._id], // file-type streams don't have members
			token: this.teamCreatorData.accessToken	// the team creator also creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create some posts in the stream we created
	createPosts (callback) {
		this.posts = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream we created
	createPost (n, callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// the "other user" creates the posts, since we want them to be "unread"
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.posts.push(response.post);
				callback();
			},
			postOptions
		);
	}

	// validate the response to the request
	validateResponse (data) {
		// we fetched the user's "user" object, we should see their lastReads attribute
		// for the created stream set to 0, meaning they haven't read any messages in that
		// stream
		Assert(data.user.lastReads[this.stream._id] === 0, 'lastReads for stream is not 0');
	}
}

module.exports = LastReadsNoneTest;
