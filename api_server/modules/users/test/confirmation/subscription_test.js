'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const ConfirmationTest = require('./confirmation_test');

class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
		this.teamOptions.creatorIndex = 1;
		this.teamOptions.numAdditionalInvites = 2;
		this.streamOptions.creatorIndex = 1;
	}

	get description () {
		return `user should be able to subscribe to the ${this.which} channel after they confirm registration`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			ConfirmationTest.prototype.before.bind(this),
			this.confirm
		], callback);
	}

	after (callback) {
		this.pubnubClient.unsubscribeAll();
		super.after(callback);
	}

	getUserData () {
		const data = this.userFactory.getRandomUserData();
		data.email = this.users[3].user.email;
		return data;
	}
			
	// confirm the user, this gives us an access token and allows us to subscribe to the channel of interest
	confirm (callback) {
		// make the confirmation request to get the access token
		const data = {
			email: this.data.email,
			confirmationCode: this.data.confirmationCode
		};
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/confirm',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				this.pubnubToken = response.pubnubToken;
				callback();
			}
		);
	}

	// run the actual test...
	run (callback) {
		// create a pubnub client and attempt to subscribe to the channel of interest
		this.pubnubClient = this.createPubNubClient();
		let channel = `${this.which}-${this[this.which].id}`;
		this.pubnubClient.subscribe(
			channel,
			() => {},
			error => {
				Assert.ifError(error, `error subscribing to ${channel}`);
				callback();
			}
		);
	}

	// create a pubnub client, through which we'll attempt to subscribe to the channel of interest
	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.user._pubnubUuid || this.user.id;
		clientConfig.authKey = this.pubnubToken;	// the PubNub token is the auth key for the subscription
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
