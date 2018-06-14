'use strict';

const ResendConfirmEmailTest = require('./resend_confirm_email_test');
const Assert = require('assert');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AlreadyRegisteredEmailTest extends ResendConfirmEmailTest {

	get description () {
		return 'should send an already-registered email when a user sends a resend confirm request and the user is already registered';
	}

	// make the data that will be used during the test
	makeData (callback) {
		// in between registering the user and doing the resend confirm request, we'll confirm the user
		BoundAsync.series(this, [
			this.registerUser,
			this.confirmUser,
			this.resendConfirm
		], callback);
	}
    
	// confirm the user that we already sent a register request for
	confirmUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: {
					token: this.originalToken
				}
			},
			callback
		);
	}

	// validate that all the email "substitutions" are correct, these are the fields that
	// are set dynamically by the email notification code, sendgrid then uses these
	// field substitutions in the template
	validateSubstitutions () {
		// for this email there are no substitions, so we're overriding ResendConfirmEmailTest
	}

	// validate the template is correct for an already registered email
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.alreadyRegisteredEmailTemplateId, 'incorrect templateId');
	}
}

module.exports = AlreadyRegisteredEmailTest;
