'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class LastReadsClearedForAuthorTest extends CodeStreamAPITest {

	get description () {
		return `last read attribute for members of the stream should get updated to the previous post when a new post is created in a ${this.type} stream, for members who are not caught up on the conversation`;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create the user who will create a team
			this.createOtherUser,	// create another user
			this.createRepo,		// create a repo (which will also create a team)
			this.createStream,		// create a stream in the repo or team
			this.createFirstPost,	// create a post in the stream, this will set the current user's lastReads
			this.currentUserCreatesPost	// current user creates a post, this should clear their lastReads
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
			type: 'channel',
			teamId: this.team._id,
			memberIds: [this.currentUser._id, this.otherUserData.user._id],
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

	// create a post in the stream we created
	createFirstPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// the "other user" creates the post, since we want them to be "unread"
		};
		this.postFactory.createRandomPost(
			callback,
			postOptions
		);
	}

	// "current user" creates a post, which should clear their lastReads for the stream
	currentUserCreatesPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.token	// the "current user" creates the post
		};
		this.postFactory.createRandomPost(
			callback,
			postOptions
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// we fetched the user's "user" object, their lastReads attribute for the stream should be clear
		Assert(typeof data.user.lastReads[this.stream._id] === 'undefined', 'lastReads for stream is not clear');
	}
}

module.exports = LastReadsClearedForAuthorTest;
