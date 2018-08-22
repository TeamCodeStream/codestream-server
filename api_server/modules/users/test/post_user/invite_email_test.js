// serves as the base class for other invite email tests

'use strict';

var Assert = require('assert');
var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
var CommonInit = require('./common_init');
const EmailConfig = require(process.env.CS_API_TOP + '/config/email');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const WebClientConfig = require(process.env.CS_API_TOP + '/config/webclient');

class InviteEmailTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	constructor (options) {
		super(options);
		this.messageReceiveTimeout = 15000;	// wait 15 seconds for message
	}

	get description () {
		return 'should send an invite email when a new user is created by another user';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			this.data._subscriptionCheat = SecretsConfig.subscriptionCheat;	// allow client to subscribe to their me-channel, even though not registered yet
			this.data._delayEmail = 10000;	// delay the sending of the email, so we can start subscribing to the me-channel before the email is sent
			// we'll do the triggering request here, but with a delay for when the
			// email goes out ... this is because we need to know which pubnub channel
			// to subscribe to in advance of running the test
			this.doApiRequest(
				{
					method: 'post',
					path: '/users',
					data: this.data,
					token: this.token,
					testEmails: true
				},
				(error, response) => {
					if (error) { return callback(error); }
					this.userCreator = this.currentUser;
					this.currentUser = response.user;
					this.pubNubToken = this.currentUser._id;	// use this for the pubnub auth key
					callback();
				}
			);
		});
	}

	// set the channel name to listen for the email message on
	setChannelName (callback) {
		// for the user we expect to receive the invite email, we use their me-channel
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
		const userName = this.getUserName(this.userCreator);
		Assert.equal(message.from.email, 'alerts@codestream.com', 'incorrect from address');
		Assert.equal(message.from.name, userName, 'incorrect from name');
	}

	// validate that the to field of the email data is correct
	validateTo (message) {
		const personalization = message.personalizations[0];
		const to = personalization.to[0];
		const userName = this.getUserName(this.currentUser);
		Assert.equal(to.email, this.currentUser.email, 'incorrect to address');
		Assert.equal(to.name, userName, 'incorrect to name');
	}

	// validate that all the email "substitutions" are correct, these are the fields that
	// are set dynamically by the email notification code, sendgrid then uses these
	// field substitutions in the template
	validateSubstitutions (message) {
		let substitutions = message.personalizations[0].substitutions;
		Assert.equal(substitutions['{{teamName}}'], this.team.name, 'incorrect team name');
		const email = encodeURIComponent(this.currentUser.email);
		const expectedLink = `${WebClientConfig.host}/signup?email=${email}&utm_medium=email&utm_source=product&utm_campaign=invitation_email&force_auth=true`;
		Assert.equal(substitutions['{{checkOutLink}}'], expectedLink, 'incorrect check-out link');
	}

	// validate the template is correct for an email notification
	validateTemplateId (message) {
		const templateId = this.existingUserIsRegistered ?
			EmailConfig.registeredUserInviteEmailTemplateId :
			EmailConfig.newUserInviteEmailTemplateId;
		Assert.equal(message.template_id, templateId, 'incorrect templateId');
	}

	// get the expected username for the given user
	getUserName (user) {
		return user.fullName || user.email;
	}
}

module.exports = InviteEmailTest;
