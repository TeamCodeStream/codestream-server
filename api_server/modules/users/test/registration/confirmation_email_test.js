// serves as the base class for other email notification tests

'use strict';

var Assert = require('assert');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');

class ConfirmationEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 10000;	// wait 10 seconds for message
	}

	get description () {
		return 'should send a confirmation email when a new user registers';
	}

	dontWantToken () {
		return true;	// we don't want a registered user for this test
	}

	// make the data that will be used during the test
	makeData (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data.email = this.useEmail || this.data.email; // allow sub-class override
		this.data._subscriptionCheat = SecretsConfig.subscriptionCheat;	// allow client to subscribe to their me-channel, even though not registered yet
		this.data._delayEmail = 10000;	// delay the sending of the email, so we can start subscribing to the me-channel before the email is sent
		if (this.wantLink) {
			this.data.wantLink = true;
		}
		// register a random user
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data,
				testEmails: true,	// this should get us email data back in the pubnub me-channel
				requestOptions: {
					headers: this.useHeaders
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser = response.user;
				this.pubNubToken = this.currentUser._id;	// use this for the pubnub auth key
				callback();
			}
		);
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user we expect to receive the confirmation email, we use their me-channel
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
		Assert.equal(substitutions['{{code}}'], this.currentUser.confirmationCode, 'incorrect confirmation code');
		Assert.equal(substitutions['{{name}}'], this.getUserName(this.currentUser), 'incorrect user name');
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.confirmationEmailTemplateId, 'incorrect templateId');
	}

	// get the expected username for the given user
	getUserName (user) {
		return user.fullName || user.email;
	}
}

module.exports = ConfirmationEmailTest;
