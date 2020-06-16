'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const RandomString = require('randomstring');
const User = require(process.env.CS_API_TOP + '/modules/users/user');
const Assert = require('assert');

class ConfirmationMessageToTeamTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			numAdditionalInvites: 2
		});
		this.expectedOrigin = 'VS Code';
		this.apiRequestOptions = {
			headers: {
				'X-CS-Plugin-IDE': this.expectedOrigin
			}
		};
	}

	get description () {
		return 'team members should receive a message indicating a user is registered when a user on the team confirms registration';
	}

	// make the data we need to trigger the test message
	makeData (callback) {
		this.registerUser(callback); // register a user (without confirming), this is the user we will now confirm for the test...
	}

	// register a user (without confirmation)
	registerUser (callback) {
		// get the user we created who is yet unregistered
		this.registeringUser = this.users[3].user;

		// form the data for the registration
		const data = {
			email: this.registeringUser.email,
			username: RandomString.generate(12),
			password: RandomString.generate(12),
			_confirmationCheat: this.apiConfig.secrets.confirmationCheat,	// gives us the confirmation code in the response
			_forceConfirmation: true								// this forces confirmation even if not enforced in environment
		};
		// register this user (without confirmation)
		this.userFactory.registerUser(
			data,
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
		this.channelName = 'team-' + this.team.id;
		callback();
	}

	// generate the test message
	generateMessage (callback) {
		// the message we expect to receive is the registered user, with isRegistered flag set
		let user = new User(this.registeringUser);
		let userObject = user.getSanitizedObject();
		Object.assign(userObject, {
			isRegistered: true,
			joinMethod: 'Added to Team',
			primaryReferral: 'internal',
			originTeamId: this.team.id,
			version: 3
		});
		delete userObject.inviteCode;
		this.message = {
			users: [userObject]
		};
		this.beforeConfirmTime = Date.now();

		// confirming the user should trigger the message
		this.userFactory.confirmUser(this.registeringUser, callback, { headers: { 'x-cs-plugin-ide': this.expectedOrigin }});
	}

	// validate the message received
	validateMessage (message) {
		// we can't predict these in advance, just check that they were updated
		// and then add them to our comparison message for validation
		const user = message.message.users[0];
		Assert(typeof user.modifiedAt === 'number' && user.modifiedAt >= this.beforeConfirmTime, 'modifiedAt not updated properly');
		Assert(typeof user.registeredAt === 'number' && user.registeredAt > this.beforeConfirmTime, 'registeredAt not updated properly');
		Assert(typeof user.lastLogin === 'number' && user.lastLogin > this.beforeConfirmTime, 'lastLogin not updated properly');
		Assert.equal(user.lastOrigin, this.expectedOrigin, 'lastOrigin not set to plugin IDE');
		this.message.users[0].modifiedAt = user.modifiedAt;
		this.message.users[0].registeredAt = user.registeredAt;
		this.message.users[0].lastLogin = user.lastLogin;
		this.message.users[0].lastOrigin = this.expectedOrigin;
		return super.validateMessage(message);
	}
}

module.exports = ConfirmationMessageToTeamTest;
