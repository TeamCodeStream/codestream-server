// Herein we define a CodeStream Message Tester class
// This class manages running API Server Tests against a CodeStream API Server,
// then listening for the resultant broadcaster messages, and validating the results

'use strict';

class CodeStreamMessageTester {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testRunner.testOptions;
	}

	async before () {
		await this.makeBroadcasterClient();
		await this.wait();
		await this.listen();
	}

	async test () {
		await this.waitForMessage();
		if (this.messageTimer) {
			clearTimeout(this.messageTimer);
			delete this.messageTimer;
		}
	}

	async after () {
	}

	async makeBroadcasterClient () {
		const testData = this.testRunner.getTestData();
		const config = testData.getCacheItem('config');

		const { listeningUser = 'currentUser' } = this.testOptions;
		const userData = testData.findOneByTag('users', listeningUser);
		if (!userData) {
			throw new Error(`CodeStream Message Tester was unable to find a current user to listen`);
		}
		const { user, broadcasterToken } = userData;
		const { id, _pubnubUuid } = user;

		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, config.broadcastEngine.pubnub);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = _pubnubUuid || id;
		clientConfig.authKey = broadcasterToken;
		if (this.inMockMode()) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = config.apiServer.ipc.serverId;
		}
		let client = this.inMockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		this.broadcasterClient = new PubNubClient({
			pubnub: client
		});
		this.broadcasterClient.init();
		this.testLog(`Made PubNub client for user ${id}, token ${broadcasterToken}`);
	}

	// wait for permissions to be set through pubnub PAM
	async wait () {
		const time = this.inMockMode ? 100 : 5000;
		this.testLog(`Waiting ${time} for message...`);
		return new Promise(resolve => {
			setTimeout(resolve, time);
		});
	}

	// begin listening on the simulated client
	async listen () {
		const { channel, timeout = 5000 } = this.testOptions;
		if (!channel) {
			throw new Error(`No channel specified for CodeStream Message Test`);
		}
		this.channel = channel;

		this.testLog(`Client listening on ${channel}, will time out after ${timeout} ms...`);
		this.messageTimer = setTimeout(
			this.messageTimeout.bind(this, channel),
			timeout
		);

		try {
			await this.broadcasterClient.subscribe(
				channel,
				this.messageReceived.bind(this),
				{
					onFail: this.onSubscribeFail ? this.onSubscribeFail.bind(this) : undefined
				}
			);
			this.testLog(`Subscribed to ${channel}`);
		} catch (error) {
			this.testLog(`Failed to subscribe to ${channel}`);
			throw error;
		}
	}

	// wait for the message to arrive
	async waitForMessage () {
		return new Promise((resolve, reject) => {
			if (this.messageAlreadyReceived) {
				resolve();
			} else {
				this.messageCallback = resolve;
				this.messageReject = reject;
			}
		});
	}
	
	// called if message doesn't arrive after timeout
	messageTimeout (channel) {
		Assert.fail('message never arrived for ' + channel);
	}

	// called when a message has been received, assert that it matches expectations
	messageReceived (error, message) {
		if (error) { return this.messageReject(error); }
		if (message.channel !== this.channel) {
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
			this.expectedMessage.requestId = message.message.requestId;	// don't care what it is
			Assert(message.message.messageId, 'received message has no messageId');
			this.expectedMessage.messageId = message.message.messageId;	// don't care what it is
		}
		Assert.deepEqual(message.message, this.expectedMessage, 'received message doesn\'t match');
		return true;
	}
}

module.exports = CodeStreamMessageTester;


