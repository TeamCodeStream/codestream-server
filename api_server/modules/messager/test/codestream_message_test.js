'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const SocketClusterConfig = require(process.env.CS_API_TOP + '/config/socketcluster');
const SocketClusterClient = require(process.env.CS_API_TOP + '/server_utils/socketcluster/socketcluster_client');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const RandomString = require('randomstring');
const OS = require('os');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

/* eslint no-console: 0 */

class CodeStreamMessageTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress messages ordinarily, but since we're actually testing them...
		this.usingSocketCluster = SocketClusterConfig.port;
	}

	// before the test, set up messaging clients and start listening
	before (callback) {
		if (this.mockMode && this.wantServer) {
			return callback();
		}
		this.messagerClientsForUser = {};
		BoundAsync.series(this, [
			super.before,
			this.makeData,	// make whatever data we need to be in the database to proceed
			this.makeMessagerForServer,	// make messager client simulating server to send
			this.makeMessagerForClient,	// make messager client simulating client to receive
			this.setChannelName,	// set the channel name that we'll listen for
			this.wait				// wait a bit for access privileges to be set
		], callback);
	}

	// after the test runs, unsubscribe from all channels
	after (callback) {
		Object.keys(this.messagerClientsForUser || []).forEach(userId => {
			this.messagerClientsForUser[userId].unsubscribeAll();
			this.messagerClientsForUser[userId].disconnect();
		});
		if (this.messagerForServer) {
			this.messagerForServer.unsubscribeAll();
		}
		super.after(callback);
	}

	// during the test, we send a message and wait for it to arrive
	run (callback) {
		if (this.mockMode && this.wantServer) {
			console.warn('NOTE - THIS TEST CAN NOT SIMULATE A SERVER IN MOCK MODE, PASSING SUPERFICIALLY');
			this.testDidNotRun = true;
			return callback();
		}
		BoundAsync.series(this, [
			this.listenOnClient,	// start listening first
			this.waitForSubscribe,	// after listening, wait a bit till we generate the message
			this.generateMessage,	// now trigger whatever request will cause the message to be sent
			this.waitForMessage,	// wait for the message to arrive
			this.clearTimer			// once the message arrives, stop waiting
		], callback);
	}

	makeMessagerForServer (callback) {
		if (!this.wantServer) {
			return callback();
		}
		if (this.usingSocketCluster) {
			return this.makeSocketClusterClientForServer(callback);
		}
		// all we have to do here is provide the full config, which includes the secretKey
		let config = Object.assign({}, PubNubConfig);
		config.uuid = `API-${OS.hostname()}-${this.testNum}`;
		if (this.mockMode) {
			throw 'test client can not be a server in mock mode';
		}
		let client = new PubNub(config);
		this.pubnubForServer = new PubNubClient({
			pubnub: client
		});
		this.pubnubForServer.init();
		callback();
	}

	async makeSocketClusterClientForServer (callback) {
		const config = Object.assign({}, SocketClusterConfig);
		this.messagerForServer = new SocketClusterClient(config);
		try {
			await this.messagerForServer.init();
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	makeMessagerForClient (callback) {
		if (this.usingSocketCluster) {
			return this.makeSocketClusterClientForClient(callback);
		}

		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const token = this.currentUser.pubnubToken;
		const user = this.currentUser.user;
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = user._pubnubUuid || user.id;
		clientConfig.authKey = token;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = IpcConfig.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		this.messagerClientsForUser[user.id] = new PubNubClient({
			pubnub: client
		});
		this.messagerClientsForUser[user.id].init();
		callback();
	}

	async makeSocketClusterClientForClient (callback) {
		const { user, pubnubToken } = this.currentUser;
		const config = Object.assign({}, SocketClusterConfig, {
			uid: user.id,
			authKey: pubnubToken,
		});
		if (this.cheatOnSubscription) {
			config.authSecret = SecretsConfig.subscriptionCheat;
		}
		this.messagerClientsForUser[user.id] = new SocketClusterClient(config);
		try {
			await this.messagerClientsForUser[user.id].init();
		}
		catch (error) {
			return callback(error);
		}
		callback();
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
		setTimeout(callback, time);
	}

	// begin listening on the simulated client
	async listenOnClient (callback) {
		// we'll time out after 5 seconds
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this, this.channelName),
			this.messageReceiveTimeout || 5000
		);
		// subscribe to the channel of interest
		const messager = this.messagerClientsForUser[this.currentUser.user.id];
		try {
			await messager.subscribe(
				this.channelName,
				this.messageReceived.bind(this),
				{
					withPresence: this.withPresence,
					onFail: this.onSubscribeFail ? this.onSubscribeFail.bind(this) : undefined
				}
			);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	// wait some period after we subscribe before generating the test message
	// in most cases, we don't need to wait, override this to wait longer
	waitForSubscribe (callback) {
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
			return;	// ignore
		}
		else if (!this.validateMessage(message)) {
			return; // ignore
		}

		// the message can actually arrive before we are waiting for it, so in that case signal that we already got it
		if (this.messageCallback) {
			this.messageCallback();
		}
		else {
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

	// generate the message, this could be overriden but by default it just sends a random message
	generateMessage (callback) {
		this.sendFromServer(callback);
	}

	// send a random message from the server
	sendFromServer (callback) {
		this.message = RandomString.generate(100);
		this.messagerForServer.publish(
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
