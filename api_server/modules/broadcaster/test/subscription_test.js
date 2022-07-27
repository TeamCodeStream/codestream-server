'use strict';

const PubNub = require('pubnub');
const MockPubnub = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/mock_pubnub');
const PubNubClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/pubnub/pubnub_client_async');
const SocketClusterClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/socketcluster/socketcluster_client');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
	}

	get description () {
		const whichChannel = this.whichChannel || 'user';
		const v3AddOn = this.useV3BroadcasterToken ? ', using a V3 PubNub Access Manager issued broadcaster token' : '';
		const desc = `current user should be able to subscribe to their ${whichChannel} channel${v3AddOn}`;
		return desc;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.makeSubscribingData,
			this.makeBroadcasterClient,
			this.setChannelName,
			this.triggerSubscription,
			this.obtainV3BroadcasterToken
		], callback);
	}
	
	after (callback) {
		this.broadcasterClient.unsubscribeAll();
		this.broadcasterClient.disconnect();
		super.after(callback);
	}

	makeBroadcasterClient (callback) {
		this.broadcasterClient = this.createBroadcasterClient();
		(async () => {
			this.broadcasterClient.init();
			callback();
		})();
	}

	makeSubscribingData (callback) {
		callback();
	}

	setChannelName (callback) {
		const whichChannel = this.whichChannel || 'user';
		const whichObject = typeof this.whichObject === 'string' ? 
			this[this.whichObject] :
			(this.whichObject || this.currentUser.user);
		this.channelName = `${whichChannel}-${whichObject.id}`;
		callback();
	}

	triggerSubscription (callback) {
		callback();
	}

	// run the test
	run (callback) {
		(async () => {
			try {
				await this.broadcasterClient.subscribe(
					this.channelName,
					() => {}
				);
			} catch (error) {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				Assert.fail(`error subscribing to ${this.channelName}: ${message}`);
			}
			callback();
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
				uid: user.id,
				authKey: broadcasterToken 
			}
		);
		return new SocketClusterClient(config);
	}

	createPubnubClient () { 
		const subscribingUser = this.subscribingUser || this.currentUser;

		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		const token = this.useV3BroadcasterToken ? subscribingUser.broadcasterV3Token : subscribingUser.broadcasterToken;
		const clientConfig = Object.assign({}, this.apiConfig.broadcastEngine.pubnub);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = subscribingUser.user._pubnubUuid || subscribingUser.user.id;
		if (!this.useV3BroadcasterToken) {
			clientConfig.authKey = subscribingUser.broadcasterToken;
		}
		if (this.mockMode) {
			clientConfig.ipc = this.ipc;
			clientConfig.serverId = this.apiConfig.apiServer.ipc.serverId;
		}
		let client = this.mockMode ? new MockPubnub(clientConfig) : new PubNub(clientConfig);
		if (this.useV3BroadcasterToken) {
			client.setToken(token);
		}
		return new PubNubClient({
			pubnub: client
		});
	}

	// for V3 PubNub Access Manager, a new token is issued if the user has created a team,
	// we need to obtain that new token before proceeding with the test
	obtainV3BroadcasterToken (callback) {
		if (!this.useV3BroadcasterToken || this.dontObtainV3Token) { return callback(); }

		const subscribingUser = this.subscribingUser || this.currentUser;
		let path = '/bcast-token';
		if (this.setV3TokenTTL) {
			path += '?force=1';
		}
		const requestOptions = {
			method: 'get',
			path,
			token: subscribingUser.accessToken
		};
		if (this.setV3TokenTTL) {
			requestOptions.requestOptions = {
				headers: {
					'x-cs-bcast-token-ttl': `${this.setV3TokenTTL}`
				}
			};
		}
		this.doApiRequest(
			requestOptions,
			(error, response) => {
				if (error) { return callback(error); }
				subscribingUser.broadcasterV3Token = response.token;
				this.broadcasterClient.pubnub.setToken(response.token);
				callback();
			}
		);
	}
}

module.exports = SubscriptionTest;
