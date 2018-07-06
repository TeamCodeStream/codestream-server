'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var PubNub = require('pubnub');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/server_utils/pubnub/pubnub_client.js');
var OS = require('os');

class CodeStreamMessageACLTest extends CodeStreamAPITest {

	// before the test, create a disallowed user and set up pubnub clients
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another user
			this.setClients,		// make pubnub client simulating server to send and client to receive
			this.makeData,			// make whatever data we need to be in the database to proceed
			this.setChannelName,	// set the channel name that we'll listen for
			this.wait				// wait a bit for access privileges to be set
		], callback);
	}

	// during the test
	run (callback) {
		// try to subscribe to the channel of interest, because we're not in the team, this should fail
		this.trySubscribe(callback);
	}

	// create a user who will not be allowed to subscribe to the test channel
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// establish the PubNub clients we will use to send and receive a message
	setClients (callback) {
		// set up the pubnub client as if we are the server
		// all we have to do here is provide the full config, which includes the secretKey
		let config = Object.assign({}, PubNubConfig);
		config.uuid = `API-${OS.hostname()}-${this.testNum}`;
		let client = new PubNub(config);
		this.pubnubForServer = new PubNubClient({
			pubnub: client
		});

		// set up the pubnub client as if we are a client, we can't control access rights in this case
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		// we simulate a client for the other user here, this user should not have access to the channel
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.uuid = this.otherUserData.user._pubnubUuid || this.otherUserData.user._id;
		clientConfig.authKey = this.otherUserData.pubNubToken;
		client = new PubNub(clientConfig);
		this.pubnubForClient = new PubNubClient({
			pubnub: client
		});
		callback();
	}

	// make whatever data we need to set up our messaging, this should be overridden for specific tests
	makeData (callback) {
		callback();
	}

	// wait for permissions to be set through pubnub PAM
	wait (callback) {
		setTimeout(callback, 2000);
	}

	// try to subscribe to the channel of interest, since we set up the pubnub client for the "other" user,
	// we should fail to subscribe
	trySubscribe (callback) {
		this.pubnubForClient.subscribe(
			this.channelName,
			() => {
				Assert.fail('message received');
			},
			(error) => {
				Assert(error, 'error not thrown trying to subscribe');
				callback();
			}
		);
	}
}

module.exports = CodeStreamMessageACLTest;
