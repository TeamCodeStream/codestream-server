'use strict';

var SlackPostTest = require('./slack_post_test');
var RandomString = require('randomstring');
var Assert = require('assert');

class NewUserTest extends SlackPostTest {

	get description () {
		return 'should create and return a post when a slack post call is made, and if the user was unknown, a new user should be created, made part of the team, and returned in the response';
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a random email and username as the post author
			this.data.authorEmail = this.userFactory.randomEmail();
			this.data.authorUsername = RandomString.generate(12);
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got a new user with the response, matching the expected email and username
		Assert(data.users, 'no users sent with response');
		const user = data.users[0];
		Assert.equal(user.email, this.data.authorEmail, 'returned user doesn\'t match author email');
		if (!this.ignoreUsername) {
			Assert.equal(user.username, this.data.authorUsername, 'returned user doesn\'t match author username');
		}
		Assert.deepEqual(user.teamIds, [this.team._id], 'teams in returned user are not correct');
		this.createdAuthor = user;
		super.validateResponse(data);
	}
}

module.exports = NewUserTest;
