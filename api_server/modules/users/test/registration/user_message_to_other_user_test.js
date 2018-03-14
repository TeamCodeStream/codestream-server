'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RandomString = require('randomstring');
var User = require(process.env.CS_API_TOP + '/modules/users/user');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class UserMessageToOtherUserTest extends CodeStreamMessageTest {

	get description () {
		return 'team members should receive a user message when a user registers, if they are already on a team';
	}

	// make the data we'll use for the test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo			// create a repo and team
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

	// create a repo and team
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include the "current" user in the team
				withRandomEmails: 1,					// include an additional unregistered user, we'll then attempt to register this user
				token: this.otherUserData.accessToken	// the "other" user creates the team
			}
		);
	}

	// set the channel name we expect to receive a message on
	setChannelName (callback) {
		// newly registered users should be seen on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// issue the request that generates the message we expect to see
	generateMessage (callback) {
		// find the user we are registering among the users we got back when we created the team
		this.registeringUser = this.users.find(user => {
			return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
		});
		// give this user some random attributes
		let data = {
			username: RandomString.generate(12),
			firstName: RandomString.generate(12),
			lastName: RandomString.generate(12)
		};
		Object.assign(this.registeringUser, data);
		let user = new User(this.registeringUser);
		// we expect a "sanitized" version of this user in the response
		let userObject = user.getSanitizedObject();
		this.message = {
			users: [userObject]
		};
		// add a password in the registration, plus cheat codes
		Object.assign(data, {
			email: this.registeringUser.email,
			password: RandomString.generate(12),
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
			_forceConfirmation: true								// this forces confirmation even if not enforced in environment
		});
		this.userFactory.registerUser(data, callback);
	}

	// validate the received message
	messageReceived (error, message) {
		if (message && message.message && message.message.users && message.message.users[0]) {
			// no way of knowing what this will be, so just set it to what we receive before we compare
			this.message.users[0].modifiedAt = message.message.users[0].modifiedAt;
		}
		super.messageReceived(error, message);
	}
}

module.exports = UserMessageToOtherUserTest;
