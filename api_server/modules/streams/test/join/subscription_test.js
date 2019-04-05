'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const SocketClusterConfig = require(process.env.CS_API_TOP + '/config/socketcluster');
const SocketClusterClient = require(process.env.CS_API_TOP + '/server_utils/socketcluster/socketcluster_client');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const JoinTest = require('./join_test');
const Assert = require('assert');

class SubscriptionTest extends JoinTest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
		this.usingSocketCluster = SocketClusterConfig.port;
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
		this.broadcasterClient.unsubscribeAll();
		this.broadcasterClient.disconnect();
		super.after(callback);
	}

	// wait a bit for the subscription access to be granted
	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 300 : 5000);
		setTimeout(callback, time);
	}

	// run the test
	run (callback) {
		(async () => {
			// create a broadcaster client and attempt to subscribe to whichever channel
			this.broadcasterClient = this.createBroadcasterClient();
			this.broadcasterClient.init();
			const channel = `stream-${this.stream.id}`;
			try {
				await this.broadcasterClient.subscribe(
					channel,
					() => {}
				);
				callback();
			}
			catch (error) {
				Assert.fail(`error subscribing to ${channel}`);
			}
		})();
	}

	createBroadcasterClient () {
		if (this.usingSocketCluster) {
			return this.createSocketClusterClient();
		}
		else {
			return this.createPubnubClient();
		}
	}

	createSocketClusterClient () {
		const { user, broadcasterToken } = this.currentUser;
		const config = Object.assign({}, SocketClusterConfig, {
			uid: user.id,
			authKey: broadcasterToken 
		});
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser.user.id;
		clientConfig.authKey = this.currentUser.broadcasterToken;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = IpcConfig.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
