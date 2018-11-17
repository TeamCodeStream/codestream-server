'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const PubNub = require('pubnub');
const PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
const PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client.js');
const Assert = require('assert');
const LoginTest = require('./login_test');

class SubscriptionTest extends LoginTest {

	constructor (options) {
		super(options);
		this.reallySendMessages = true;	// we suppress pubnub messages ordinarily, but since we're actually testing them...
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
	}

	get description () {
		return `user should be able to subscribe to the ${this.which} channel after they login using access token`;
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.login,	 			// the "current" user now logs in
			this.wait				// wait a bit for the permissions to be granted
		], callback);
	}

	// the "current" user now logs in, this should grant access to the expected channel
	login (callback) {
		// make the login request 
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				data: {},
				token: this.token
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
		setTimeout(callback, 2000);
	}

	// run the actual test...
	run (callback) {
		// create a pubnub client and attempt to subscribe to the channel of interest
		let pubNubClient = this.createPubNubClient();
		let channel = `${this.which}-${this[this.which].id}`;
		pubNubClient.subscribe(
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
		clientConfig.uuid = this.currentUser.user._pubnubUuid || this.currentUser.user.id;
		clientConfig.authKey = this.pubnubToken;	// the PubNub token is the auth key for the subscription
		let client = new PubNub(clientConfig);
		return new PubNubClient({
			pubnub: client
		});
	}
}

module.exports = SubscriptionTest;
