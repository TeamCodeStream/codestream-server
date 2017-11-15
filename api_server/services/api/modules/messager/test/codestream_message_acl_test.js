'use strict';

var Assert = require('assert');
var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var PubNub = require('pubnub');
var PubNubConfig = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNubClient = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');

class CodeStreamMessage_ACLTest extends CodeStreamAPITest {

	// before the test, create a disallowed user and set up pubnub clients
	before (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.setClients,
			this.makeData,
			this.setChannelName,
			this.wait
		], callback);
	}

	// during the test, we send a message and wait for it to arrive
	run (callback) {
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
		let client = new PubNub(PubNubConfig);
		this.pubnubForServer = new PubNubClient({
			pubnub: client
		});

		// set up the pubnub client as if we are a client, we can't control access rights in this case
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let clientConfig = Object.assign({}, PubNubConfig);
		delete clientConfig.secretKey;
		delete clientConfig.publishKey;
		clientConfig.authKey = this.otherUserData.user._id;
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

module.exports = CodeStreamMessage_ACLTest;
