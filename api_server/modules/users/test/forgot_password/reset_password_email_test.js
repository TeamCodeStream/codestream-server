// serves as the base class for tests of the /no-auth/forgot-password request, for users requesting a 
// password reset email

'use strict';

var Assert = require('assert');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const WebClientConfig = require(process.env.CS_API_TOP + '/config/webclient');

class ResetPasswordEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.timeout = 10000;	// wait 10 seconds for message
	}

	get description () {
		return 'should send a reset password email when a user sends a forgot password request';
	}

	// make the data that will be used during the test request
	makeRequestData () {
		return {
			email: this.currentUser.email,
			_delayEmail: 10000 // delay the sending of the email, so we can start subscribing to the me-channel before the email is sent
		};
	}

	// make the data that will be used during the test
	makeData (callback) {
		// initiate the forgot-password request
		this.data = this.makeRequestData();
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/forgot-password',
				data: this.data,
				testEmails: true	// this should get us email data back in the pubnub me-channel
			},
			callback
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user we expect to receive the reset password email, we use their me-channel
		// we'll be sending the data that we would otherwise send to the outbound email
		// service (sendgrid) on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser._id}`;
		callback();
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// in this case, we've already started the test in makeData, which created the user ...
		// but the email was delayed, so we can just start listening for it now...
		callback();
	}

	// validate the message received from pubnub
	validateMessage (message) {
		message = message.message;
		if (!message.from && !message.to) { return false; }	// ignore anything not matching
		this.validateFrom(message);
		this.validateTo(message);
		this.validateSubstitutions(message);
		this.validateTemplateId(message);
		return true;
	}

	// validate that the from field of the email data is correct
	validateFrom (message) {
		Assert.equal(message.from.email, 'support@codestream.com', 'incorrect from address');
		Assert.equal(message.from.name, 'CodeStream', 'incorrect from name');
	}

	// validate that the to field of the email data is correct
	validateTo (message) {
		let personalization = message.personalizations[0];
		let to = personalization.to[0];
		const userName = this.getUserName(this.currentUser);
		Assert.equal(to.email, this.currentUser.email, 'incorrect to address');
		Assert.equal(to.name, userName, 'incorrect to name');
	}

	// validate that all the email "substitutions" are correct, these are the fields that
	// are set dynamically by the email notification code, sendgrid then uses these
	// field substitutions in the template
	validateSubstitutions (message) {
		let substitutions = message.personalizations[0].substitutions;
		// verify a match to the url
		const host = WebClientConfig.host.replace(/\//g, '\\/');
		const shouldMatch = new RegExp(`${host}\\/reset-password\\/(.*)$`);
		const match = substitutions['{{url}}'].match(shouldMatch);
		Assert(match && match.length === 2, 'reset password link url is not correct');
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.resetPasswordEmailTemplateId, 'incorrect templateId');
	}

	// get the expected username for the given user
	getUserName (user) {
		return user.fullName || user.email;
	}
}

module.exports = ResetPasswordEmailTest;
