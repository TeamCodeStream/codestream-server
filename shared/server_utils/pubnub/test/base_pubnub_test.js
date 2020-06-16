'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
var PubNub = require('pubnub');
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
var RandomString = require('randomstring');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
var OS = require('os');

class BasePubNubTest extends GenericTest {

	constructor (options) {
		super(options);
		this.numClients = this.numClients || 1;
	}

	// called before the actual test
	async before (callback) {
		this.config = await ApiConfig.loadPreferredConfig();
		if (this.config.whichBroadcastEngine !== 'pubnub') {
			console.log('NOTE - Pubnub tests cannot pass if pubnub is not enabled, test will pass superficially');
			return callback();
		}

		this.channelName = RandomString.generate(12);
		this.message = RandomString.generate(100);
		BoundAsync.series(this, [
			this.setClients,	// set up the pubnub clients (one will act like our server, others will act like our clients)
			this.grantAccess	// grant access to the client pubnubs
		], callback);
	}

	// run the test itself
	run (callback) {
		if (this.config.whichBroadcastEngine !== 'pubnub') {
			return callback();
		}
		super.run(callback);
	}

	// after the test runs, unsubscribe from all channels
	after (callback) {
		if (this.pubnubForClients) {
			this.pubnubForClients.forEach(pubnub => {
				pubnub.unsubscribeAll();
				pubnub.disconnect();
			});
		}
		if (this.pubnubForServer) {
			this.pubnubForServer.unsubscribeAll();
			this.pubnubForServer.disconnect();
		}
		super.after(callback);
	}

	// establish the PubNub clients we will use
	setClients (callback) {
		// set up the pubnub client as if we are the server, this give us the right to set permissions
		// all we have to do here is provide the full config, which includes the secretKey
		let config = Object.assign({}, ApiConfig.getPreferredConfig().pubnub);
		config.uuid = `API-${OS.hostname()}-${this.testNum}`;
		let client = new PubNub(config);
		this.pubnubForServer = new PubNubClient({
			pubnub: client
		});
		this.pubnubForServer.init();

		// set up two pubnub clients
		this.pubnubForClients = new Array(this.numClients);
		this.authKeys = new Array(this.numClients);
		this.uuids = new Array(this.numClients);
		for (let i = 0; i < this.numClients; i++) {
			let clientConfig = Object.assign({}, ApiConfig.getPreferredConfig().pubnub);
			delete clientConfig.secretKey;
			this.uuids[i] = clientConfig.uuid = `TESTUSER-${this.testNum}-${i}`;
			this.authKeys[i] = clientConfig.authKey = RandomString.generate(12);
			client = new PubNub(clientConfig);
			this.pubnubForClients[i] = new PubNubClient({
				pubnub: client
			});
			this.pubnubForClients[i].init();
		}
		callback();
	}

	// grant access for the clients to subscribe
	grantAccess (callback) {
		BoundAsync.times(
			this,
			this.numClients,
			(n, timesCallback) => {
				(async () => {
					await this.pubnubForServer.grant(
						this.authKeys[n],
						this.channelName,
						{
							includePresence: this.withPresence
						}
					);
					timesCallback();
				})();
			},
			callback
		);
	}

	// begin listening to our random channel on the client
	listenOnClient (callback) {
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this),
			this.messageReceiveTimeout || 5000
		);

		(async () => {
			try {
				await this.pubnubForClients[0].subscribe(
					this.channelName,
					this.messageReceived.bind(this),
					{
						withPresence: this.withPresence
					}
				);
			}
			catch (error) {
				return callback(error);			
			}
			callback();
		})();
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
		if (error) { 
			return this.messageCallback(error); 
		}
		if (this.validateMessage(message)) {
			this.messageCallback();
		}
	}

	// send a random message from the server
	sendRandomFromServer (callback) {
		(async () => {
			await this.pubnubForServer.publish(
				this.message,
				this.channelName
			);
			callback();
		})();
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
