'use strict';

const ResetPasswordEmailTest = require('./reset_password_email_test');
const Assert = require('assert');

class UnregisteredUserTest extends ResetPasswordEmailTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = this.mockMode ? 3000 : 10000;
		Object.assign(this.userOptions, {
			numRegistered: 0,
			numUnregistered: 1,
			cheatOnSubscription: true
		});
		delete this.teamOptions.creatorIndex;
		this.cheatOnSubscription = true;
		this.listeningUserIndex = 0;
	}
	
	get description () {
		return 'should not send a reset password email when handling a reset password request for an email that belongs to an unregistered user';
	}

	// make the data that will be used during the test request
	makeRequestData () {
		// substitute a random email
		const data = super.makeRequestData();
		data.email = this.users[0].user.email;
		return data;
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('email message was received');
	}
}

module.exports = UnregisteredUserTest;
