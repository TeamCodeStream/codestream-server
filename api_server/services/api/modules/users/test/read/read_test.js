'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
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

	get path () {
		return '/users/me';
	}

	getExpectedFields () {
		let userResponse = {};
		userResponse.user = [...UserTestConstants.EXPECTED_USER_FIELDS, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return userResponse;
	}

	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createOtherStream,
			this.createPost,
			this.createOtherPost,
			this.markRead
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
				callback();
			},
			streamOptions
		);
	}

	createOtherStream (callback) {
		let streamOptions = {
			type: 'file',
			teamId: this.team._id,
			repoId: this.repo._id,
			token: this.otherUserData.accessToken
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

	createPost (callback) {
		let postOptions = {
			streamId: this.stream._id,
			token: this.otherUserData.accessToken
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

	createOtherPost (callback) {
		let postOptions = {
			streamId: this.otherStream._id,
			token: this.otherUserData.accessToken
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

	validateResponse (data) {
		let expectedLastReads = {
			[this.otherStream._id]: '0'
		};
		Assert.deepEqual(expectedLastReads, data.user.lastReads, 'lastReads doesn\'t match');
		this.validateSanitized(data.user);
	}

	validateSanitized (user, fields) {
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
