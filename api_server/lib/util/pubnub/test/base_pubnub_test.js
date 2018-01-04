'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var PubNubClient = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNub = require('pubnub');
var RandomString = require('randomstring');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class BasePubNubTest extends GenericTest {

	constructor (options) {
		super(options);
		this.numClients = this.numClients || 1;
	}

	// called before the actual test
	before (callback) {
		this.channelName = RandomString.generate(12);
		this.message = RandomString.generate(100);
		BoundAsync.series(this, [
			this.setClients,	// set up the pubnub clients (one will act like our server, others will act like our clients)
			this.grantAccess	// grant access to the client pubnubs
		], callback);
	}

	// establish the PubNub clients we will use
	setClients (callback) {
		// set up the pubnub client as if we are the server, this give us the right to set permissions
		// all we have to do here is provide the full config, which includes the secretKey
		let client = new PubNub(Object.assign({}, PubNubConfig));
		this.pubnubForServer = new PubNubClient({
			pubnub: client
		});

		// set up two pubnub clients
		this.pubnubForClients = new Array(this.numClients);
		this.authKeys = new Array(this.numClients);
		this.uuids = new Array(this.numClients);
		for (let i = 0; i < this.numClients; i++) {
			let clientConfig = Object.assign({}, PubNubConfig);
			delete clientConfig.secretKey;
			this.uuids[i] = clientConfig.uuid = RandomString.generate(12);
			this.authKeys[i] = clientConfig.authKey = RandomString.generate(12);
			client = new PubNub(clientConfig);
			this.pubnubForClients[i] = new PubNubClient({
				pubnub: client
			});
		}
		callback();
	}

	// grant access for the clients to subscribe
	grantAccess (callback) {
		BoundAsync.times(
			this,
			this.numClients,
			(n, timesCallback) => {
				this.pubnubForServer.grant(
					this.authKeys[n],
					this.channelName,
					timesCallback,
					{
						includePresence: this.withPresence
					}
				);
			},
			callback
		);
	}

	// begin listening to our random channel on the client
	listenOnClient (callback) {
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this),
			this.timeout || 5000
		);
		this.pubnubForClients[0].subscribe(
			this.channelName,
			this.messageReceived.bind(this),
			callback,
			{
				withPresence: this.withPresence
			}
		);
	}

	// called if message doesn't arrive after timeout
	messageTimeout () {
		Assert.fail('message never arrived');
	}

	// called when a message has been received, assert that it matches expectations
	messageReceived (error, message) {
		if (!this.messageCallback) {
			// this can happen (rarely) if the message comes back before we actually start waiting,
			// in this case we'll just store the message for immediate processing once we start waiting
			this.gotMessage = {
				error: error,
				message: message
			};
			return;
		}
		if (error) { return this.messageCallback(error); }
		if (this.validateMessage(message)) {
			this.messageCallback();
		}
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
		if (this.gotMessage) {
			// already got the message, before we even started waiting
			return this.messageReceived(this.gotMessage.error, this.gotMessage.message);
		}
		// otherwise, do nothing until the message arrives...
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

module.exports = BasePubNubTest;
