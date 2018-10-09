// base class for many tests of the "PUT /bump-posts" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		this.data = { };
		this.numPosts = 2;
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo,			// create a repo and team
			this.createStream,			// create a stream in the repo
			this.createOtherPost,		// other user creates a single post
			this.createPosts			// create a series of post in the stream
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

	// create a repo (and team)
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],		// include the "current" user
				token: this.otherUserData.accessToken		// "other" user creates the repo/team
			}
		);
	}

	// create a file-type stream in the repo
	createStream (callback) {
		// include the current user in the stream unless otherwise specified
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			memberIds: [this.currentUser._id],	
			token: this.otherUserData.accessToken	// "other" user creates the stream
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

	// other user creates a single post
	createOtherPost (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}
	
	// create a series of posts in the stream
	createPosts (callback) {
		this.posts = [];
		BoundAsync.timesSeries(
			this,
			this.numPosts,
			this.createPost,
			callback
		);
	}

	// create a post in the stream
	createPost (n, callback) {
		const postOptions = {
			streamId: this.stream._id,
			token: this.token	// current user is the author of the post, to give them some totalPosts
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

	// do the test request of bumping posts count
	bumpPosts (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/bump-posts',
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
