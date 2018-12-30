'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const MockPubnub = require(process.env.CS_API_TOP + '/server_utils/pubnub/mock_pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client');
const IpcConfig = require(process.env.CS_API_TOP + '/config/ipc');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');

class SubscriptionTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
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
		this.pubnubClient.unsubscribeAll();
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
				this.pubnubToken = response.pubnubToken;
				callback();
			}
		);
	}

	// wait a bit for the permissions to be granted
	wait (callback) {
		const time = this.mockMode ? 200 : 2000;
		setTimeout(callback, time);
	}

	// run the actual test...
	run (callback) {
		// create a pubnub client and attempt to subscribe to the channel of interest
		this.pubnubClient = this.createPubNubClient();
		this.pubnubClient.init();
		let channel = `${this.which}-${this[this.which].id}`;
		this.pubnubClient.subscribe(
			channel,
			() => {},
			error => {
				Assert.ifError(error, `error subscribing to ${channel}`);
				callback();
			}
		);
	}

	// create a pubnub client, through which we'll attempt to subscribe to the channel of interest
	createPubNubClient () {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.currentUser._pubnubUuid || this.currentUser.id;
		clientConfig.authKey = this.pubnubToken;	// the PubNub token is the auth key for the subscription
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
