// serves as the base class for other email notification tests

'use strict';

var Assert = require('assert');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets.js');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class ResendConfirmEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.timeout = 10000;	// wait 10 seconds for message
	}

	get description () {
		return 'should send a confirmation email when a resend confirmation request is made';
	}

	dontWantToken () {
		return true;	// we don't want a registered user for this test
	}

	// make the data that will be used during the test
	makeData (callback) {
		BoundAsync.series(this, [
			this.registerUser,
			this.resendConfirm
		], callback);
	}
    
	// register a user to use for the test
	registerUser (callback) {
		this.data = this.userFactory.getRandomUserData();
		this.data.email = this.useEmail || this.data.email; // allow sub-class override
		this.data._subscriptionCheat = SecretsConfig.subscriptionCheat;	// allow client to subscribe to their me-channel, even though not registered yet
		this.data._confirmationCheat = SecretsConfig.confirmationCheat; // to get the confirmation token back in the response
		this.data.wantLink = true;
		// register a random user
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: this.data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.currentUser = response.user;
				this.token = this.currentUser._id;	// use this for the pubnub auth key
				this.originalToken = response.user.confirmationToken;
				callback();
			}
		);
	}

	// now send the resend-confirm request
	resendConfirm (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/resend-confirm',
				data: {
					email: this.data.email,
					_delayEmail: 10000 // delay the email so we have time to subscribe
				},
				testEmails: true	// this should get us email data back in the pubnub me-channel
			},
			callback
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
		// in this case, we've already started the test in makeData, which created the user 
		// and then made the resend request...
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
		// we won't verify the actual url, but we'll just check that it's there
		Assert(substitutions['{{url}}'], 'no url in field substitutions');
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		Assert.equal(message.template_id, EmailConfig.confirmationLinkEmailTemplateId, 'incorrect templateId');
	}

	// get the expected username for the given user
	getUserName (user) {
		const firstName = user.firstName;
		const lastName = user.lastName;
		if (firstName && lastName) {
			return firstName + ' ' + lastName;
		}
		else if (firstName) {
			return firstName;
		}
		else {
			return user.email;
		}
	}
}

module.exports = ResendConfirmEmailTest;
