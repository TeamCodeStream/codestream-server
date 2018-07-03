'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var RandomString = require('randomstring');
var User = require(process.env.CS_API_TOP + '/modules/users/user');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class UserMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'the team creator should receive a user message when a user registers, if they are already on a team';
	}

	// make the data we'll use for the test
	makeData (callback) {
		// create a repo (and team)
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				this.users = response.users;
				callback();
			},
			{
				withRandomEmails: 2,	// add some unregistered users, then we'll register one of them
				token: this.token		// the "current" user creates the repo and team
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
		// we'll register one of the unregistered users
		this.registeringUser = this.users[1];
		// give this user some random attributes
		Object.assign(this.registeringUser, {
			username: RandomString.generate(12),
			fullName: this.userFactory.randomFullName()
		});
		let user = new User(this.registeringUser);
		// we expect a "sanitized" version of this user in the response
		let userObject = user.getSanitizedObject();
		this.message = {
			users: [userObject]
		};
		// add a password in the registration, plus cheat codes
		Object.assign(this.registeringUser, {
			password: RandomString.generate(12),
			_confirmationCheat: SecretsConfig.confirmationCheat,	// gives us the confirmation code in the response
			_forceConfirmation: true								// this forces confirmation even if not enforced in environment
		});
		this.userFactory.registerUser(this.registeringUser, callback);
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

module.exports = UserMessageToTeamTest;
