'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const UserTestConstants = require('../user_test_constants');
const UserAttributes = require('../../user_attributes');

class ReadTest extends CodeStreamAPITest {

	get description () {
		return 'should clear lastReads for the specified stream ID for the current user ';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		// we expect to see the usual fields for a user, plus fields only the user themselves should see
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return userResponse;
	}

	// before the test runs...
	before (callback) {
		this.path = '/users/me';
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo,			// create a repo and team
			this.createStream,			// create a stream in the repo
			this.createOtherStream,		// create a second stream (control stream) in the repo
			this.createPost,			// create a post in the first stream
			this.createOtherPost,		// create a post in the second stream
			this.markRead				// mark the first stream as "read"
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
		let streamOptions = {
			type: 'channel',
			teamId: this.team._id,
			memberIds: [this.currentUser._id],	// include the "current" user in the stream
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

	// create a second file-type stream
	createOtherStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken	// "other" user creates the stream
		};
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				callback();
			},
			streamOptions
		);
	}

	// create a post in the first stream
	createPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken	// "other" user is the author of the post
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.post = response.post;
				callback();
			},
			postOptions
		);
	}

	// create a post in the second stream
	createOtherPost (callback) {
		let postOptions = {
			streamId: this.otherStream._id,
			token: this.otherUserData.accessToken	// "other" user is the author of the post
		};
		this.postFactory.createRandomPost(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherPost = response.post;
				callback();
			},
			postOptions
		);
	}

	// mark the first stream as read
	markRead (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/read/' + this.stream._id,
				token: this.token
			},
			callback
		);
	}

	// validate the response to the test request
	validateResponse (data) {
		// we expect to see a 0 for the stream we haven't read, but nothing for the
		// stream we have read
		let expectedLastReads = {
			[this.otherStream._id]: '0'
		};
		Assert.deepEqual(expectedLastReads, data.user.lastReads, 'lastReads doesn\'t match');
		this.validateSanitized(data.user);
	}

	// validate that the response has no attributes that should not be sent to clients
	validateSanitized (user, fields) {
		// the base-clase validation doesn't know to avoid looking for me-only attributes,
		// so remove those from the fields we'll be checking against
		fields = fields || UserTestConstants.UNSANITIZED_ATTRIBUTES;
		let meAttributes = Object.keys(UserAttributes).filter(attribute => UserAttributes[attribute].forMe);
		meAttributes.forEach(attribute => {
			let index = fields.indexOf(attribute);
			if (index !== -1) {
				fields.splice(index, 1);
			}
		});
		super.validateSanitized(user, fields);
	}
}

module.exports = ReadTest;
