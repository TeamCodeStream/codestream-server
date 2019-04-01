'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const RandomString = require('randomstring');
const User = require(process.env.CS_API_TOP + '/modules/users/user');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class UserMessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.teamOptions.numAdditionalInvites = 2;
	}

	get description () {
		return 'team members should receive a user message when a user registers, if they are already on a team';
	}

	// set the channel name we expect to receive a message on
	setChannelName (callback) {
		// newly registered users should be seen on the team channel
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// issue the request that generates the message we expect to see
	generateMessage (callback) {
		this.registeringUser = this.users[2].user;
		// give this user some random attributes
		let data = {
			username: RandomString.generate(12),
			fullName: this.userFactory.randomFullName()
		};
		Object.assign(this.registeringUser, data);
		let user = new User(this.registeringUser);
		// we expect a "sanitized" version of this user in the response
		let userObject = user.getSanitizedObject();
		userObject.version = 2;	// version number will be bumped when the user confirms
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

module.exports = UserMessageToTeamTest;
