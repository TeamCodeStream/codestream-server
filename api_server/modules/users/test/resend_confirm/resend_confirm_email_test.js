// serves as the base class for other email notification tests

'use strict';

const Assert = require('assert');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const TokenHandler = require(process.env.CS_API_TOP + '/server_utils/token_handler');

class ResendConfirmEmailTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		this.messageReceiveTimeout = 10000;	// wait 10 seconds for message
		this.cheatOnSubscription = true;
	}

	get description () {
		return 'should send a confirmation email when a resend confirmation request is made';
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
		this.data._subscriptionCheat = ApiConfig.getPreferredConfig().secrets.subscriptionCheat;	// allow client to subscribe to their me-channel, even though not registered yet
		this.data._confirmationCheat = ApiConfig.getPreferredConfig().secrets.confirmationCheat; // to get the confirmation token back in the response
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
				this.currentUser = {
					user: response.user,
					broadcasterToken: response.user.id
				};
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
					_delayEmail: this.usingSocketCluster ? 1000 : (this.mockMode ? 500 : 10000) // delay the email so we have time to subscribe
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
		// service on this channel, and then we'll validate the data
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message that starts the test
	generateMessage (callback) {
		// this is the message we expect to see
		this.message = {
			type: 'confirm',
			userId: this.currentUser.user.id
		};
		// in this case, we've already started the test in makeData, which created the user
		// and then made the resend request...
		// but the email was delayed, so we can just start listening for it now...
		callback();
	}

	// validate the message received from pubnub
	validateMessage (message) {
		if (this.noToken) {
			return super.validateMessage(message);
		}
		const gotMessage = message.message;
		if (!gotMessage.type) { return false; }	// ignore anything not matching

		// verify a match to the url
		// Note: there is no 'webclient.host' property anymore. Expectation is this test is disabled
		const host = ApiConfig.getPreferredConfig().webclient.host.replace(/\//g, '\\/');
		const shouldMatch = new RegExp(`${host}\\/confirm-email\\/(.*)$`);
		const match = gotMessage.url.match(shouldMatch);
		Assert(match && match.length === 2, 'confirmation link url is not correct');

		// verify correct payload
		const token = match[1];
		const payload = new TokenHandler(ApiConfig.getPreferredConfig().secrets.auth).verify(token);
		Assert.equal(payload.iss, 'CodeStream', 'token payload issuer is not CodeStream');
		Assert.equal(payload.alg, 'HS256', 'token payload algortihm is not HS256');
		Assert.equal(payload.type, 'conf', 'token payload type should be conf');
		Assert.equal(payload.uid, this.currentUser.user.id, 'uid in token payload is incorrect');
		Assert(payload.iat <= Math.floor(Date.now() / 1000), 'iat in token payload is not earlier than now');
		Assert.equal(payload.exp, payload.iat + 86400, 'token payload expiration is not one day out');

		// pass deepEqual
		this.message.url = gotMessage.url;
		return super.validateMessage(message);
	}
}

module.exports = ResendConfirmEmailTest;
