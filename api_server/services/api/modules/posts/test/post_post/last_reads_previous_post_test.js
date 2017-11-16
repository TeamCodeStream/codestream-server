'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class LastReadsPreviousPostTest extends CodeStreamAPITest {

	get description () {
		return `last read attribute for members of the stream should get updated to the previous post when a new post is created in a ${this.type} stream, for members who are not caught up on the conversation`;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createFirstPosts,
			this.markRead,
			this.createLastPost
		], callback);
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}

	getExpectedFields () {
		return { user: ['lastReads'] };
	}

	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamCreatorData = response;
				callback();
			}
		);
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
				withEmails: [this.currentUser.email, this.otherUserData.user.email],
				token: this.teamCreatorData.accessToken
			}
		);
	}

	createStream (callback) {
		let streamOptions = {
			type: this.type,
			teamId: this.team._id,
			repoId: this.type === 'file' ? this.repo._id : null,
			memberIds: this.type === 'file' ? null : [this.currentUser._id, this.otherUserData.user._id],
			token: this.teamCreatorData.accessToken
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

	createFirstPosts (callback) {
		this.firstPosts = [];
		BoundAsync.timesSeries(
			this,
			2,
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
				this.firstPosts.push(response.post);
				callback();
			},
			postOptions
		);
	}

	markRead (callback) {
		this.doApiRequest({
			method: 'put',
			path: '/read/' + this.stream._id,
			token: this.token
		}, callback);
	}

	createLastPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.lastPost = response.post;
				callback();
			},
			postOptions
		);
	}

	validateResponse (data) {
		let lastPost = this.firstPosts[this.firstPosts.length - 1];
		Assert(data.user.lastReads[this.stream._id] === lastPost._id, 'lastReads for stream is not equal to the ID of the last post read');
	}
}

module.exports = LastReadsPreviousPostTest;
