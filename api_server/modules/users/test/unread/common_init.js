// base class for many tests of the "PUT /unread/:postId" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		this.numPosts = 5;
		this.unreadPost = 2;
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo,			// create a repo and team
			this.createStream,			// create a stream in the repo
			this.createPosts,			// create a series of post in the stream
			this.markRead				// mark the stream as "read"
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
		const memberIds = this.withoutMeInStream ? [] : [this.currentUser._id];
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			memberIds,	
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
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// "other" user is the author of the post
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

	// mark the stream as read
	markRead (callback) {
		if (this.withoutMeInStream) {
			// can't do this part if i'm not in the stream (for ACL test), just skip it
			return callback();
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.stream._id,
				token: this.token
			},
			callback
		);
	}

	// mark a given post as unread
	markUnread (callback) {
		const post = this.posts[this.unreadPost];
		this.doApiRequest(
			{
				method: 'put',
				path: '/unread/' + post._id,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
