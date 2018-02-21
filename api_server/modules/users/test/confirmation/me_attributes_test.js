'use strict';

var ConfirmationTest = require('./confirmation_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class MeAttributesTest extends ConfirmationTest {

	get description () {
		return 'user should receive me-only attributes with response to email confirmation';
	}

	getExpectedFields () {
		// when confirming, the user should receive additional attributes in the response that only they can see
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// standard set up for confirmation test
			this.createOtherUser,	// create a registered user
			this.createRepo,		// have the registered user create a repo (which creates a team)
			this.createStream,		// have the registered user create a file-type stream in the repo
			this.createPost 		// have the registered user create a post in the stream, which creates a lastReads attribute for the user
		], callback);
	}

	// create a registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo to use for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [this.data.email],	// include the user-to-confirm on the team
				token: this.otherUserData.accessToken	// the registered user creates the repo and team
			}
		);
	}

	// create a file-type stream to use for the test
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
				token: this.otherUserData.accessToken	// the registered user creates the stream
			}
		);
	}

	// create a post in the stream ... this triggers the user-to-confirm to have a lastReads attribute,
	// which only they should see and it should be included in the response when they confirm
	createPost (callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				teamId: this.team._id,
				streamId: this.stream._id,
				token: this.otherUserData.accessToken
			}
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that the user got a correct lastReads attribute when confirming
		Assert(data.user.lastReads[this.stream._id] === '0', 'lastReads should be 0');
		delete data.user.lastReads;	// so super.validateResponse will pass
		super.validateResponse(data);
	}
}

module.exports = MeAttributesTest;
