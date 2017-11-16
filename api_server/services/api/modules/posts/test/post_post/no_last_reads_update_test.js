'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NoLastReadsUpdateTest extends CodeStreamAPITest {

	get description () {
		return 'last read attribute should not be updated for members of the stream who already have a last read attribute for the stream';
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createFirstPosts,
			this.markRead,
			this.createLastPosts
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
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
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
		this.currentPosts = this.firstPosts;
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
				this.currentPosts.push(response.post);
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

	createLastPosts (callback) {
		this.lastPosts = [];
		this.currentPosts = this.lastPosts;
		BoundAsync.timesSeries(
			this,
			2,
			this.createPost,
			callback
		);
	}

	validateResponse (data) {
		let lastReadPost = this.firstPosts[this.firstPosts.length - 1];
		Assert(data.user.lastReads[this.stream._id] === lastReadPost._id, 'lastReads for stream is not equal to the ID of the last post read');
	}
}

module.exports = NoLastReadsUpdateTest;
