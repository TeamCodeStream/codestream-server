'use strict';

const ConfirmationEmailTest = require('./confirmation_email_test');
const Assert = require('assert');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');

class ConfirmationEmailWithLinkTest extends ConfirmationEmailTest {

	constructor (options) {
		super(options);
		this.wantLink = true;
	}

	get description () {
		return 'should send a confirmation email with a confirmation link when a new user registers with the wantLink flag';
	}

	// validate that all the email "substitutions" are correct, these are the fields that
	// are set dynamically by the email notification code, sendgrid then uses these
	// field substitutions in the template
	validateSubstitutions (message) {
		let substitutions = message.personalizations[0].substitutions;
		// we won't verify the actual url, but we'll just check that it's there
		Assert(substitutions['{{url}}'], 'no url in field substitutions');
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.confirmationLinkEmailTemplateId, 'incorrect templateId');
	}
}

module.exports = ConfirmationEmailWithLinkTest;
