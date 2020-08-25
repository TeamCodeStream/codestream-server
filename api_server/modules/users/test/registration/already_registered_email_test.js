'use strict';

const ConfirmationEmailTest = require('./confirmation_email_test');

class AlreadyRegisteredEmailTest extends ConfirmationEmailTest {

	get description () {
		return 'should send an already-registered email when a user registers and that user is already registered';
	}

	// make the data that will be used during the test
	makeData (callback) {
		// we'll pre-create an already-registered user, before proceeding with the usual confirmation test
		// this should trigger an "already-registered" email instead of the usual confirmation email
		this.userFactory.createRandomUser((error, response) => {
			if (error) { return callback(error); }
			this.useEmail = response.user.email;
			super.makeData(callback);
		}, { confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat });
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// in this case the email type should be for an already-registered user
		super.generateMessage(() => {
			this.message.type = 'alreadyRegistered';
			callback();
		});
	}
}

module.exports = AlreadyRegisteredEmailTest;
