'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class NoLastReadsForAuthorTest extends CodeStreamAPITest {

	get description () {
		return `last read attribute for the post author should not be updated when a new post is created in a stream`;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPosts
		], callback);
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
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
			token: this.token
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
		Assert(!data.user.lastReads, 'lastReads exists');
	}
}

module.exports = NoLastReadsForAuthorTest;
