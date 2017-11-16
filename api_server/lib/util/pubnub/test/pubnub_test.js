'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var PubNubClient = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNub = require('pubnub');
var RandomString = require('randomstring');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class PubNubTest extends GenericTest {

	get description () {
		return 'client should receive the correct message through PubNub after message is sent from server';
	}

	// called before the actual test
	before (callback) {
		this.channelName = RandomString.generate(12);
		this.message = RandomString.generate(100);
		this.authKey = RandomString.generate(12);
		BoundAsync.series(this, [
			this.setClients,
			this.grantAccess
		], callback);
	}

	// the actual test execution
	run (callback) {
		BoundAsync.series(this, [
			this.listenOnClient,
			this.sendRandomFromServer,
			this.waitForMessage,
			this.clearTimer
		], callback);
	}

	// establish the PubNub clients we will use
	setClients (callback) {
		// set up the pubnub client as if we are the server, this give us the right to set permissions
		// all we have to do here is provide the full config, which includes the secretKey
		let client = new PubNub(PubNubConfig);
		this.pubnubForServer = new PubNubClient({
			pubnub: client
		});

		// set up the pubnub client as if we are a client, we can't control access rights in this case
		// we remove the secretKey, which clients should NEVER have
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		if (this.clientReadOnly) {
			delete clientConfig.publishKey;
		}
		clientConfig.authKey = this.authKey;
		client = new PubNub(clientConfig);
		this.pubnubForClient = new PubNubClient({
			pubnub: client
		});
		callback();
	}

	// grant access for the auth key to subscribe
	grantAccess (callback) {
		this.pubnubForServer.grant(
			this.authKey,
			this.channelName,
			callback
		);
	}

	// begin listening to our random channel on the client
	listenOnClient (callback) {
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this),
			this.timeout || 5000
		);
		this.pubnubForClient.subscribe(
			this.channelName,
			this.messageReceived.bind(this),
			callback
		);
	}

	// called if message doesn't arrive after timeout
	messageTimeout () {
		Assert.fail('message never arrived');
	}

	// called when a message has been received, assert that it matches expectations
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		Assert(message.channel === this.channelName, 'received message doesn\'t match channel name');
		Assert(message.message === this.message, 'received message doesn\'t match');
		this.messageCallback();
	}

	// send a random message from the server
	sendRandomFromServer (callback) {
		this.pubnubForServer.publish(
			this.message,
			this.channelName,
			callback
		);
	}

	// wait for the message to be received
	waitForMessage (callback) {
		this.messageCallback = callback;
		// now, do nothing...
	}

	// clear out timer
	clearTimer (callback) {
		if (this.messageTimer) {
			clearTimeout(this.messageTimer);
			delete this.messageTimer;
 		}
		callback();
	}
}

module.exports = PubNubTest;
