'use strict';

const ConfirmationEmailTest = require('./confirmation_email_test');
const Assert = require('assert');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const WebClientConfig = require(process.env.CS_API_TOP + '/config/webclient');
const TokenHandler = require(process.env.CS_API_TOP + '/modules/authenticator/token_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

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
		// verify a match to the url
		const host = WebClientConfig.host.replace(/\//g, '\\/');
		const shouldMatch = new RegExp(`${host}\\/confirm-email\\/(.*)$`);
		const match = substitutions['{{url}}'].match(shouldMatch);
		Assert(match && match.length === 2, 'confirmation link url is not correct');
		// verify correct payload
		const token = match[1];
		const payload = new TokenHandler(SecretsConfig.auth).verify(token);
		Assert.equal(payload.iss, 'CodeStream', 'token payload issuer is not CodeStream');
		Assert.equal(payload.alg, 'HS256', 'token payload algortihm is not HS256');
		Assert.equal(payload.type, 'conf', 'token payload type should be conf');
		Assert.equal(payload.uid, this.currentUser._id, 'uid in token payload is incorrect');
		Assert(payload.iat <= Math.floor(Date.now() / 1000), 'iat in token payload is not earlier than now');
		Assert.equal(payload.exp, payload.iat + 86400, 'token payload expiration is not one day out');
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.confirmationLinkEmailTemplateId, 'incorrect templateId');
	}
}

module.exports = ConfirmationEmailWithLinkTest;
