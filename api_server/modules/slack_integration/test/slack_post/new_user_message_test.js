'use strict';

var SlackPostMessageTest = require('./slack_post_message_test');
var RandomString = require('randomstring');
var Assert = require('assert');

class NewUserMessageTest extends SlackPostMessageTest {

	get description () {
		return 'when a slack post call is made, and if the user was unknown, a new user should be created, and the new user should be in the published message';
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

	// validate the message received
	validateMessage (message) {
		const subMessage = message.message;
		// validate that we got a new user with the response, matching the expected email and username
		Assert(subMessage.users, 'no users sent with message');
		const user = subMessage.users[0];
		Assert.equal(user.email, this.data.authorEmail, 'returned user doesn\'t match author email');
		Assert.equal(user.username, this.data.authorUsername, 'returned user doesn\t match author username');
		Assert.deepEqual(user.teamIds, [this.team._id], 'teams in returned user are not correct');
		// prepare to do a comparison with the expected message....
		this.message.users = subMessage.users;
		return super.validateMessage(message);
	}
}

module.exports = NewUserMessageTest;
