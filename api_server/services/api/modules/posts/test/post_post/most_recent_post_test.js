'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class MostRecentPostTest extends CodeStreamAPITest {

	get description () {
		return 'mostRecentPostId for the stream should get updated to the post when a post is created in the stream';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { stream: ['mostRecentPostId'] };
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPosts
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				withRandomEmails: 1,
				token: this.otherUserData.accessToken
			}
		);
	}

	createStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				this.path = '/streams/' + this.stream._id;
				callback();
			},
			streamOptions
		);
	}

	createPosts (callback) {
		this.posts = [];
		BoundAsync.timesSeries(
			this,
			3,
			this.createPost,
			callback
		);
	}

	createPost (n, callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken
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

	validateResponse (data) {
		Assert(data.stream.mostRecentPostId === this.posts[this.posts.length - 1]._id, 'mostRecentPostId for stream does not match post');
	}
}

module.exports = MostRecentPostTest;
