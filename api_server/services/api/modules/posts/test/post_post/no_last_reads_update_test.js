'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NoLastReadsUpdateTest extends CodeStreamAPITest {

	get description () {
		return 'last read attribute should not be updated for members of the stream who already have a last read attribute for the stream';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create the user who will create a team
			this.createOtherUser,	// create another user
			this.createRepo,		// create a repo (which will also create a team)
			this.createStream,		// create a stream in the repo or team
			this.createFirstPosts,	// create some posts in the stream, we'll simulate "reading" these posts
			this.markRead,			// mark the previously created posts as "read"
			this.createLastPosts	// create an additional post in the stream, this will be "unread"
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
				withEmails: [this.currentUser.email, this.otherUserData.user.email],	// put me and the other user in the te
				token: this.teamCreatorData.accessToken	// the "team creator" creates the team
			}
		);
	}

	// create a stream in the team we created
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.teamCreatorData.accessToken	// the "team creator" creates the team
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
	createFirstPosts (callback) {
		this.firstPosts = [];	// firstPosts will be the posts we created first, that will be marked read
		this.currentPosts = this.firstPosts;	// current posts will be firstPosts for now, lastPosts later
		BoundAsync.timesSeries(
			this,
			2,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream we created
	createPost (n, callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// the "other user" will create the posts
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				// "currentPosts" refer to the posts we are tracking ... firstPosts for the "read" ones, lastPosts for the "unread" ones
				this.currentPosts.push(response.post);
				callback();
			},
			postOptions
		);
	}

	// mark the posts in the stream we created "read" for the current user
	markRead (callback) {
		this.doApiRequest({
			method: 'put',
			path: '/read/' + this.stream._id,
			token: this.token
		}, callback);
	}

	// create some additional posts in the stream, these will go "unread"
	createLastPosts (callback) {
		this.lastPosts = [];	// lastPosts will be the posts that will go unread
		this.currentPosts = this.lastPosts;	// currentPosts will be the array we add the posts to
		BoundAsync.timesSeries(
			this,
			2,
			this.createPost,
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// we fetched the user's "user" object, we should see their lastReads attribute
		// for the created stream set to the last post of the first batch we created,
		// which we marked as read for the current user
		let lastReadPost = this.firstPosts[this.firstPosts.length - 1];
		Assert(data.user.lastReads[this.stream._id] === lastReadPost._id, 'lastReads for stream is not equal to the ID of the last post read');
	}
}

module.exports = NoLastReadsUpdateTest;
