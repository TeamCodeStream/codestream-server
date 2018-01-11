'use strict';

var LoginTest = require('./login_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
const UserTestConstants = require('../user_test_constants');

class MeAttributesTest extends LoginTest {

	get description () {
		return 'user should receive me-only attributes with response to login';
	}

	getExpectedFields () {
		let response = Object.assign({}, super.getExpectedFields());
		response.user = [...response.user, ...UserTestConstants.EXPECTED_ME_FIELDS];
		return response;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherUser,
			this.createRepo,
			this.createStream,
			this.createPost
		], callback);
	}

	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

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
				withEmails: [this.data.email],
				token: this.otherUserData.accessToken
			}
		);
	}

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
				token: this.otherUserData.accessToken
			}
		);
	}

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

	validateResponse (data) {
		Assert(data.user.lastReads[this.stream._id] === '0', 'last_reads should be 0');
		delete data.user.lastReads;	// so super.validateResponse will pass
		super.validateResponse(data);
	}
}

module.exports = MeAttributesTest;
