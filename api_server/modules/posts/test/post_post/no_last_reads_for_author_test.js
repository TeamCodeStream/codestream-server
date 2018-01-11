'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NoLastReadsForAuthorTest extends CodeStreamAPITest {

	get description () {
		return `last read attribute for the post author should not be updated when a new post is created in a stream`;
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
				withEmails: [this.currentUser.email, this.otherUserData.user.email],	// include me and the "other user" in the team
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo (which creates the team)
			}
		);
	}

	// create a stream in the team we created
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.teamCreatorData.accessToken	 // the "team creator" creates the stream, too
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
			token: this.token	// i am the author of these posts
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
		// since the current user was the creator of the posts, this should not
		// create any lastReads for the user
		Assert(!data.user.lastReads, 'lastReads exists');
	}
}

module.exports = NoLastReadsForAuthorTest;
