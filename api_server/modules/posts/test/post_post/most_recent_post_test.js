'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class MostRecentPostTest extends CodeStreamAPITest {

	get description () {
		// mostRecentPostId tracks the most recent post to a stream ... for lastReads to work
		// (indicating the last read message for each user who has access to the stream),
		// mostRecentPostId must get updated every time there is a new post to the stream ...
		// sortId also tracks the most recent post, but it also is set to the ID of the stream
		// if there are no posts in it ... this is used to set an easily indexed sorting order
		// for streams, which is needed for pagination
		return 'mostRecentPostId and sortId for the stream should get updated to the post when a post is created in the stream';
	}

	get method () {
		// we'll be getting the stream object for the stream
		return 'get';
	}

	getExpectedFields () {
		return { stream: ['mostRecentPostId', 'mostRecentPostCreatedAt', 'sortId'] };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second user
			this.createRepo,		// create a repo (and a team)
			this.createStream,		// create a file-type stream in that repo
			this.createPosts		// create some posts in that stream
		], callback);
	}

	// create another registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo (which will also create a team)
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include "me"
				withRandomEmails: 1, // include another random user for good measure
				token: this.otherUserData.accessToken	// the "other user" is the repo/team creator
			}
		);
	}

	// create a file-type stream in the repo we created
	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken	// the "other user" creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				// set the path for fetching the stream object in the test
				this.path = '/streams/' + this.stream._id;
				callback();
			},
			streamOptions
		);
	}

	// create some posts in the stream
	createPosts (callback) {
		this.posts = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	// create a single post in the stream
	createPost (n, callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// the "other user" creates the posts
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

	// validate the response to the test request
	validateResponse (data) {
		// validate that mostRecentPostId and sortId were both set to the ID of the
		// last post created in the stream
		Assert(data.stream.mostRecentPostId === this.posts[this.posts.length - 1]._id, 'mostRecentPostId for stream does not match post');
		Assert(data.stream.mostRecentPostCreatedAt = this.posts[this.posts.length - 1].createdAt, 'mostRecentPostCreatedAt for stream does not match post');
		Assert(data.stream.sortId === this.posts[this.posts.length - 1]._id, 'sortId for stream does not match post');
	}
}

module.exports = MostRecentPostTest;
