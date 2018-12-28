'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client');
const JoinTest = require('./join_test');
const Assert = require('assert');

class SubscriptionTest extends JoinTest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return 'user should be able to subscribe to the stream channel when they join a channel stream';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.updateStream,
			this.wait
		], callback);
	}

	after (callback) {
		this.pubnubClient.unsubscribeAll();
		super.after(callback);
	}

	// wait a bit for the subscription access to be granted
	wait (callback) {
		const time = this.mockMode ? 300 : 5000;
		setTimeout(callback, time);
	}

	// run the test
	run (callback) {
		// create a pubnub client and attempt to subscribe to whichever channel
		this.pubnubClient = this.createPubNubClient();
		const channel = `stream-${this.stream.id}`;
		this.pubnubClient.subscribe(
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
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser.user.id;
		clientConfig.authKey = this.currentUser.pubnubToken;
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
