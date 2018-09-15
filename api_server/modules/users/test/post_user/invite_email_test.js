// serves as the base class for other invite email tests

'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');
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
		// generate the expected "check-out" link
		const email = encodeURIComponent(this.currentUser.email);
		const expectedLink = `${WebClientConfig.host}/signup?email=${email}&utm_medium=email&utm_source=product&utm_campaign=invitation_email&force_auth=true`;

		// this is the message we expect to see
		this.message = {
			type: 'invite',
			userId: this.currentUser._id,
			inviterId: this.userCreator._id,
			teamName: this.team.name,
			checkOutLink: expectedLink
		};

		// in this case, we've already started the test in makeData, which created the user ...
		// but the email was delayed, so we can just start listening for it now...
		callback();
	}
}

module.exports = InviteEmailTest;
