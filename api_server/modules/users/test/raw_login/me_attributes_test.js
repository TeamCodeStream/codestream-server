'use strict';

var LoginTest = require('./login_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class MeAttributesTest extends LoginTest {

	get description () {
		return 'user should receive me-only attributes with response to a raw login';
	}

	getExpectedFields () {
		// with the login request, we should get back a user object with attributes
		// only the user should see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	// before the test runs...
	before (callback) {
		// among the attributes that only the user themselves should see are lastReads,
		// indicating conversations that have unread messages ... so we'll set up
		// an unread message in a stream and then verify we see the lastReads for that stream
		BoundAsync.series(this, [
			super.before,			// setup standard login test
			this.createOtherUser,	// create a second registered user
			this.createRepo,		// create a repo and team
			this.createStream,		// create a stream in the repo
			this.createPost			// create a post in the stream
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// have the other user create a repo (which creates a team)
	createRepo (callback) {
		this.email = this.userFactory.randomEmail();
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include the "current" user...
				token: this.otherUserData.accessToken	// but the "other" user creates the repo and team
			}
		);
	}

	// create a file-type stream in the repo
	createStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.stream = response.stream;
				callback();
			},
			{
				type: 'file',
				teamId: this.team._id,
				repoId: this.repo._id,
				token: this.otherUserData.accessToken	 // "other" user creates the stream
			}
		);
	}

	// create a post in the stream, this will be unread by the "current" user
	createPost (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				teamId: this.team._id,
				streamId: this.stream._id,
				token: this.otherUserData.accessToken	// "other" user is the author of the post
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verfiy we got a lastReads object, with an entry for the stream
		Assert(data.user.lastReads[this.stream._id] === 0, 'lastReads should be 0');
		delete data.user.lastReads;	// so super.validateResponse will pass
		super.validateResponse(data);
	}
}

module.exports = MeAttributesTest;
