'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var RandomString = require('randomstring');
var User = require(process.env.CS_API_TOP + '/modules/users/user');
var Assert = require('assert');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class ConfirmationMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'the team creator should receive a message indicating a user is registered when a user on the team confirms registration';
	}

	// make the data we need to trigger the test message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createRepo,		// create a repo to use for the test
			this.registerUser 		// register a user (without confirming), this is the user we will now confirm for the test...
		], callback);
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
				withRandomEmails: 2,	// add a couple unregistered users, one of them will be the user we register
				token: this.token		// the "current" user is the repo and team creator
			}
		);
	}

	// register a user (without confirmation)
	registerUser (callback) {
		// get one of the users we created who is yet unregistered
		this.registeringUser = this.users[1];
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
		userObject.joinMethod = 'Added to Team';
		this.message = {
			users: [userObject]
		};
		this.beforeConfirmTime = Date.now();

		// confirming the user should trigger the message
		this.userFactory.confirmUser(this.registeringUser, callback);
	}

	// validate the message received
	validateMessage (message) {
		// we can't predict these in advance, just check that they were updated
		// and then add them to our comparison message for validation
		const user = message.message.users[0];
		Assert(typeof user.modifiedAt === 'number' && user.modifiedAt > this.beforeConfirmTime, 'modifiedAt not updated properly');
		Assert(typeof user.registeredAt === 'number' && user.registeredAt > this.beforeConfirmTime, 'registeredAt not updated properly');
		this.message.users[0].modifiedAt = user.modifiedAt;
		this.message.users[0].registeredAt = user.registeredAt;
		return super.validateMessage(message);
	}
}

module.exports = ConfirmationMessageToTeamTest;
