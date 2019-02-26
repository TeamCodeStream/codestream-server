'use strict';

const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client_async');
const SocketClusterConfig = require(process.env.CS_API_TOP + '/config/socketcluster');
const SocketClusterClient = require(process.env.CS_API_TOP + '/server_utils/socketcluster/socketcluster_client');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');

// a class to check if the user gets subscribed to the team channel when a team is created
class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
		this.usingSocketCluster = SocketClusterConfig.port;
	}

	get description () {
		return 'user should be able to subscribe to the team channel when they create a new team';
	}

	after (callback) {
		this.messagerClient.unsubscribeAll();
		this.messagerClient.disconnect();
		super.after(callback);
	}

	// run the test
	async run (callback) {
		// create a pubnub client and attempt to subscribe to the team channel
		this.messagerClient = this.createMessagerClient();
		this.messagerClient.init();
		const channel = `team-${this.team.id}`;
		try {
			await this.messagerClient.subscribe(
				channel,
				() => {}
			);
			callback();
		}
		catch (error) {
			Assert.fail(`error subscribing to ${channel}`);
		}
	}

	createMessagerClient () {
		if (this.usingSocketCluster) {
			return this.createSocketClusterClient();
		}
		else {
			return this.createPubnubClient();
		}
	}

	createSocketClusterClient () {
		const { user, pubnubToken } = this.currentUser;
		const config = Object.assign({}, SocketClusterConfig, {
			uid: user.id,
			authKey: pubnubToken 
		});
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser.user.id;
		clientConfig.authKey = this.currentUser.pubnubToken;
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
