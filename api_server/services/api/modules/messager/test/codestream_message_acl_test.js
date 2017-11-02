'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var PubNub = require('pubnub');
var PubNub_Config = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNub_Client = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');

class CodeStream_Message_ACL_Test extends CodeStream_API_Test {

	// before the test, create a disallowed user and set up pubnub clients
	before (callback) {
		Bound_Async.series(this, [
			this.create_other_user,
			this.set_clients,
			this.make_data,
			this.set_channel_name,
			this.wait
		], callback);
	}

	// during the test, we send a message and wait for it to arrive
	run (callback) {
		this.try_subscribe(callback);
	}

	// create a user who will not be allowed to subscribe to the test channel
	create_other_user (callback) {
		this.user_factory.create_random_user(
			(error, response) => {
				if (error) { return callback(error); }
				this.other_user_data = response;
				callback();
			}
		);
	}

	// establish the PubNub clients we will use to send and receive a message
	set_clients (callback) {
		// set up the pubnub client as if we are the server
		// all we have to do here is provide the full config, which includes the secretKey
		let client = new PubNub(PubNub_Config);
		this.pubnub_for_server = new PubNub_Client({
			pubnub: client
		});

		// set up the pubnub client as if we are a client, we can't control access rights in this case
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let client_config = Object.assign({}, PubNub_Config);
		delete client_config.secretKey;
		delete client_config.publishKey;
		client_config.authKey = this.other_user_data.user._id;
		client = new PubNub(client_config);
		this.pubnub_for_client = new PubNub_Client({
			pubnub: client
		});
		callback();
	}

	// make whatever data we need to set up our messaging, this should be overridden for specific tests
	make_data (callback) {
		callback();
	}

	// wait for permissions to be set through pubnub PAM
	wait (callback) {
		setTimeout(callback, 2000);
	}

	try_subscribe (callback) {
		this.pubnub_for_client.subscribe(
			this.channel_name,
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

module.exports = CodeStream_Message_ACL_Test;
