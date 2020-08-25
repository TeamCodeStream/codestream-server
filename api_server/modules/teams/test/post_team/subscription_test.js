'use strict';

const PubNub = require('pubnub');
const MockPubnub = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/mock_pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

// a class to check if the user gets subscribed to the team channel when a team is created
class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		return 'user should be able to subscribe to the team channel when they create a new team';
	}

	after (callback) {
		this.broadcasterClient.unsubscribeAll();
		this.broadcasterClient.disconnect();
		super.after(callback);
	}

	// run the test
	run (callback) {
		(async () => {
			// create a pubnub client and attempt to subscribe to the team channel
			this.broadcasterClient = this.createBroadcasterClient();
			await this.broadcasterClient.init();
			const channel = `team-${this.team.id}`;
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
		const config = Object.assign({},
			{
				// formerly socketCluster object
				host: this.apiConfig.broadcastEngine.codestreamBroadcaster.host,
				port: this.apiConfig.broadcastEngine.codestreamBroadcaster.port,
				authKey: this.apiConfig.broadcastEngine.codestreamBroadcaster.secrets.api,
				ignoreHttps: this.apiConfig.broadcastEngine.codestreamBroadcaster.ignoreHttps,
				strictSSL: this.apiConfig.ssl.requireStrictSSL,
				apiSecret: this.apiConfig.broadcastEngine.codestreamBroadcaster.secrets.api
			},
			{
				uid: user.id,
				authKey: broadcasterToken 
			}
		);
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, this.apiConfig.integrations.pubnub);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser.user.id;
		clientConfig.authKey = this.currentUser.broadcasterToken;
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = this.apiConfig.apiServer.ipc.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
