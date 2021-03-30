'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/mock_pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');
const RandomString = require('randomstring');
const OS = require('os');

/* eslint no-console: 0 */

class CodeStreamMessageTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress messages ordinarily, but since we're actually testing them...
	}

	// before the test, set up messaging clients and start listening
	before (callback) {
		this.broadcasterClientsForUser = {};
		BoundAsync.series(this, [
			super.before,
			this.makeData,	// make whatever data we need to be in the database to proceed
			this.makeBroadcasterForServer,	// make broadcaster client simulating server to send
			this.makeBroadcasterForClient,	// make broadcaster client simulating client to receive
			this.setChannelName,	// set the channel name that we'll listen for
			this.wait				// wait a bit for access privileges to be set
		], callback);
	}

	// after the test runs, unsubscribe from all channels
	after (callback) {
		Object.keys(this.broadcasterClientsForUser || []).forEach(userId => {
			this.broadcasterClientsForUser[userId].unsubscribeAll();
			this.broadcasterClientsForUser[userId].disconnect();
			delete this.broadcasterClientsForUser[userId];
		});
		if (this.broadcasterForServer) {
			this.broadcasterForServer.unsubscribeAll();
			this.broadcasterForServer.disconnect();
			delete this.broadcasterForServer;
		}
		super.after(callback);
	}

	// during the test, we send a message and wait for it to arrive
	run (callback) {
		if (this.mockMode && this.wantServer && !this.usingSocketCluster) {
			console.warn('NOTE - THIS TEST CAN NOT SIMULATE A SERVER IN MOCK MODE, PASSING SUPERFICIALLY');
			this.testDidNotRun = true;
			return callback();
		}
		BoundAsync.series(this, [
			this.listenOnClient,	// start listening first
			this.waitForSubscribe,	// after listening, wait a bit till we generate the message
			this.doGenerateMessage,	// now trigger whatever request will cause the message to be sent
			this.waitForMessage,	// wait for the message to arrive
			this.clearTimer			// once the message arrives, stop waiting
		], callback);
	}

	makeBroadcasterForServer (callback) {
		if (!this.wantServer) {
			return callback();
		}
		if (this.usingSocketCluster) {
			return this.makeSocketClusterClientForServer(callback);
		}
		if (this.mockMode) {
			this.testLog('Cannot make PubNub client for server in mock mode');
			return callback();
		}

		// all we have to do here is provide the full config, which includes the secretKey
		this.testLog('Making PubNub client for server...');
		let config = Object.assign({}, this.apiConfig.broadcastEngine.pubnub);
		config.uuid = `API-${OS.hostname()}-${this.testNum}`;
		let client = new PubNub(config);
		this.broadcasterForServer = new PubNubClient({
			pubnub: client
		});
		this.broadcasterForServer.init();
		callback();
	}

	makeSocketClusterClientForServer (callback) {
		const broadcasterConfig = this.apiConfig.broadcastEngine.codestreamBroadcaster;
		this.testLog('Making SocketCluster client for server...');
		(async () => {
			const config = Object.assign({},
				{
					// formerly the socketCluster object
					host: broadcasterConfig.internalHost,
					port: broadcasterConfig.port,
					authKey: broadcasterConfig.secrets.api,
					ignoreHttps: broadcasterConfig.ignoreHttps,
					strictSSL: broadcasterConfig.sslCert.requireStrictSSL,
					apiSecret: broadcasterConfig.secrets.api
				},
				{ uid: 'API' }
			);
			this.broadcasterForServer = new SocketClusterClient(config);
			try {
				await this.broadcasterForServer.init();
			}
			catch (error) {
				return callback(error);
			}
			callback();
		})();
	}

	makeBroadcasterForClient (callback) {
		if (this.usingSocketCluster) {
			return this.makeSocketClusterClientForClient(callback);
		}

		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const token = this.currentUser.broadcasterToken;
		const user = this.currentUser.user;
		let clientConfig = Object.assign({}, this.apiConfig.broadcastEngine.pubnub);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = user._pubnubUuid || user.id;
		clientConfig.authKey = token;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = this.apiConfig.apiServer.ipc.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		this.broadcasterClientsForUser[user.id] = new PubNubClient({
			pubnub: client
		});
		this.broadcasterClientsForUser[user.id].init();
		this.testLog(`Made PubNub client for user ${user.id}, token ${token}`);
		callback();
	}

	makeSocketClusterClientForClient (callback) {
		const { user, broadcasterToken } = this.currentUser;
		const broadcasterConfig = this.apiConfig.broadcastEngine.codestreamBroadcaster;
		const config = Object.assign({},
			{
				// formerly the socketCluster object
				host: broadcasterConfig.internalHost,
				port: broadcasterConfig.port,
				authKey: broadcasterConfig.secrets.api,
				ignoreHttps: broadcasterConfig.ignoreHttps,
				strictSSL: broadcasterConfig.requireStrictSSL,
				apiSecret: broadcasterConfig.secrets.api
			},
			{
				uid: user.id,
				authKey: broadcasterToken,
			}
		);
		if (this.cheatOnSubscription) {
			config.subscriptionCheat = this.apiConfig.sharedSecrets.subscriptionCheat;
		}

		(async () => {
			this.broadcasterClientsForUser[user.id] = new SocketClusterClient(config);
			try {
				await this.broadcasterClientsForUser[user.id].init();
				this.testLog(`Made SocketCluster client for user ${user.id}, token ${broadcasterToken}`);
			}
			catch (error) {
				return callback(error);
			}
			callback();
		})();
	}

	// make whatever data we need to set up our messaging, this should be overridden for specific tests
	makeData (callback) {
		callback();
	}

	// set the channel name of interest, this should be overridden for specific tests
	setChannelName (callback) {
		callback('setChannelName should be overridden');
	}

	// wait for permissions to be set through pubnub PAM
	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 100 : 5000);
		this.testLog(`Waiting ${time} for message...`);
		setTimeout(callback, time);
	}

	// begin listening on the simulated client
	listenOnClient (callback) {
		// we'll time out after 5 seconds
		const timeout = this.messageReceiveTimeout || 5000;
		this.testLog(`Client listening on ${this.channelName}, will time out after ${timeout} ms...`);
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this, this.channelName),
			timeout
		);

		(async () => {
			// subscribe to the channel of interest
			const broadcaster = this.broadcasterClientsForUser[this.currentUser.user.id];
			try {
				await broadcaster.subscribe(
					this.channelName,
					this.messageReceived.bind(this),
					{
						//withPresence: this.withPresence,
						onFail: this.onSubscribeFail ? this.onSubscribeFail.bind(this) : undefined
					}
				);
				this.testLog(`Subscribed to ${this.channelName}`);
			}
			catch (error) {
				this.testLog(`Failed to subscribe to ${this.channelName}`);
				return callback(error);
			}
			callback();
		})();
	}

	// wait some period after we subscribe before generating the test message
	// in most cases, we don't need to wait, override this to wait longer
	waitForSubscribe (callback) {
		this.testLog('Waiting 0 for subscribe...');
		setTimeout(callback, 0);
	}

	// called if message doesn't arrive after timeout
	messageTimeout (channel) {
		Assert.fail('message never arrived for ' + channel);
	}

	// called when a message has been received, assert that it matches expectations
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.channel !== this.channelName) {
			this.testLog(`Received message ${message.messageId} on ${message.channel}, ignoring:\n${JSON.stringify(message, 0, 10)}`);
			return;	// ignore
		}
		else if (!this.validateMessage(message)) {
			this.testLog(`Received message ${message.messageId} on ${message.channel}, but was not validated:\n${JSON.stringify(message, 0, 10)}`);
			return; // ignore
		}

		// the message can actually arrive before we are waiting for it, so in that case signal that we already got it
		if (this.messageCallback) {
			this.testLog(`Message ${message.messageId} validated`);
			this.messageCallback();
		}
		else {
			this.testLog(`Message ${message.messageId} already received`);
			this.messageAlreadyReceived = true;
		}
	}

	// validate the message received against expectations
	validateMessage (message) {
		if (typeof message.message === 'object') {
			Assert(message.message.requestId, 'received message has no requestId');
			this.message.requestId = message.message.requestId;	// don't care what it is
			Assert(message.message.messageId, 'received message has no messageId');
			this.message.messageId = message.message.messageId;	// don't care what it is
		}
		Assert.deepEqual(message.message, this.message, 'received message doesn\'t match');
		return true;
	}

	// generate the message, and log when we are doing it
	doGenerateMessage (callback) {
		this.testLog('Generating message...');
		this.generateMessage(callback);
	}

	// generate the message, this could be overriden but by default it just sends a random message
	generateMessage (callback) {
		this.sendFromServer(callback);
	}

	// send a random message from the server
	sendFromServer (callback) {
		this.message = RandomString.generate(100);
		this.testLog('Publishing message from server...');
		this.broadcasterForServer.publish(
			this.message,
			this.channelName
		);
		callback();
	}

	// wait for the message to arrive
	waitForMessage (callback) {
		if (this.messageAlreadyReceived) {
			return callback();
		}
		else {
			this.messageCallback = callback;
			// do nothing until we get the message or a timeout...
		}
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

module.exports = CodeStreamMessageTest;
