'use strict';

const ConfirmationEmailTest = require('./confirmation_email_test');
const Assert = require('assert');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');

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
		});
	}


	// validate that all the email "substitutions" are correct, these are the fields that
	// are set dynamically by the email notification code, sendgrid then uses these
	// field substitutions in the template
	validateSubstitutions () {
		// for this email there are no substitions, so we're overriding ConfirmationEmailTest
	}

	// validate the template is correct for an already registered email
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.alreadyRegisteredEmailTemplateId, 'incorrect templateId');
	}


}

module.exports = AlreadyRegisteredEmailTest;
