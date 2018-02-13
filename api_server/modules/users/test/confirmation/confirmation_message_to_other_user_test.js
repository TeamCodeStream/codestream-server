'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RandomString = require('randomstring');
var User = require(process.env.CS_API_TOP + '/modules/users/user');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class ConfirmationMessageToOtherUserTest extends CodeStreamMessageTest {

	get description () {
		return 'team members should receive a message indicating a user is registered when a user on the team confirms registration';
	}

	// make the data we need to trigger the test message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second registered user
			this.createRepo,		// create a repo to use for the test
			this.registerUser 		// register a user (without confirming), this is the user we will now confirm for the test...
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

	// create a repo to use for the test
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
				withEmails: [this.currentUser.email],	// include the current user in the team
				withRandomEmails: 1,					// include another unregistered user, this is the user we'll register and confirm
				token: this.otherUserData.accessToken	// "other" user creates the repo and team
			}
		);
	}

	// register a user (without confirmation)
	registerUser (callback) {
		// get the user we created who is yet unregistered
		this.registeringUser = this.users.find(user => {
			return user._id !== this.currentUser._id && user._id !== this.otherUserData.user._id;
		});
		// form the data for the registration
		let register = {
			email: this.registeringUser.email,
			username: RandomString.generate(12),
			password: RandomString.generate(12),
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
			_forceConfirmation: true								// this forces confirmation even if not enforced in environment
		};
		Object.assign(this.registeringUser, register);
		// register this user (without confirmation)
		this.userFactory.registerUser(
			register,
			(error, response) => {
				if (error) { return callback(error); }
				this.registeringUser = response.user;
				callback();
			}
		);
	}

	// set the name of the channel we'll listen on for the test message
	setChannelName (callback) {
		// the team channel gets the message that a new user has confirmed registration
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// generate the test message
	generateMessage (callback) {
		// the message we expect to receive is the registered user, with isRegistered flag set
		let user = new User(this.registeringUser);
		let userObject = user.getSanitizedObject();
		userObject.isRegistered = true;
		this.message = {
			users: [userObject]
		};

		// confirming the user should trigger the message
		this.userFactory.confirmUser(this.registeringUser, callback);
	}
}

module.exports = ConfirmationMessageToOtherUserTest;
