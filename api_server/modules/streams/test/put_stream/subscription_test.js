'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client.js');
const AddUserTest = require('./add_user_test');
const Assert = require('assert');

class SubscriptionTest extends AddUserTest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return 'user should be able to subscribe to the stream channel when they are added to a channel stream';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateStream,
			this.wait	
		], callback);
	}

	// update the stream as per the usual test, but this time we're waiting to make sure we can subscribe to the channel
	updateStream (callback) {
		// do the update, this should grant the added user access to the stream channel
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				data: this.data,
				token: this.token
			},
			callback
		);
	}

	// wait a bit for the subscription access to be granted
	wait (callback) {
		setTimeout(callback, 5000);
	}

	// run the test
	run (callback) {
		// create a pubnub client and attempt to subscribe to whichever channel
		const pubNubClient = this.createPubNubClient();
		const channel = `stream-${this.stream._id}`;
		pubNubClient.subscribe(
			channel,
			() => {},
			error => {
				Assert.ifError(error, `error subscribing to ${channel}`);
				callback();
			}
		);
	}

	// create a pubnub client for the test
	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.addedUserData.user._pubnubUuid || this.addedUserData.user._id;
		clientConfig.authKey = this.addedUserData.pubNubToken;
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
