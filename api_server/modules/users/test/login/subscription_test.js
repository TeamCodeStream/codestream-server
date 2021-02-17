'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/mock_pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
		this.teamOptions.numRegistered = 2;
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
	}

	get description () {
		return `user should be able to subscribe to the ${this.which} channel after they login`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.login,
			this.wait
		], callback);
	}

	after (callback) {
		this.broadcasterClient.unsubscribeAll();
		this.broadcasterClient.disconnect();
		super.after(callback);
	}

	// the "current" user now logs in, this should grant access to the expected channel
	login (callback) {
		// make the login request 
		const data = {
			email: this.currentUser.user.email,
			password: this.currentUser.password
		};
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/login',
				data: data
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				this.broadcasterToken = response.broadcasterToken;
				callback();
			}
		);
	}

	// wait a bit for the permissions to be granted
	wait (callback) {
		const time = this.usingSocketCluster ? 0 : (this.mockMode ? 300 : 5000);
		setTimeout(callback, time);
	}

	// run the actual test...
	run (callback) {
		(async () => {
			// create a pubnub client and attempt to subscribe to the channel of interest
			this.broadcasterClient = this.createBroadcasterClient();
			await this.broadcasterClient.init();
			let channel = `${this.which}-${this[this.which].id}`;
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
		const broadcasterConfig = this.apiConfig.broadcastEngine.codestreamBroadcaster;
		const config = Object.assign({},
			{
				// formerly socketCluster object
				host: broadcasterConfig.host,
				port: broadcasterConfig.port,
				authKey: broadcasterConfig.secrets.api,
				ignoreHttps: broadcasterConfig.ignoreHttps,
				strictSSL: broadcasterConfig.sslCert.requireStrictSSL,
				apiSecret: broadcasterConfig.secrets.api
			},
			{
				uid: this.user.id,
				authKey: this.broadcasterToken 
			}
		);
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const clientConfig = Object.assign({}, this.apiConfig.broadcastEngine.pubnub);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.user._pubnubUuid || this.user.id;
		clientConfig.authKey = this.broadcasterToken;	// the PubNub token is the auth key for the subscription
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
