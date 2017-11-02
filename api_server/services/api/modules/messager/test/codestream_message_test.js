'use strict';

var Assert = require('assert');
var CodeStream_API_Test = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var PubNub = require('pubnub');
var PubNub_Config = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNub_Client = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');
var Random_String = require('randomstring');

class CodeStream_Message_Test extends CodeStream_API_Test {

	// before the test, set up pubnub clients and start listening
	before (callback) {
		Bound_Async.series(this, [
			this.set_clients,
			this.make_data,
			this.set_channel_name,
			this.wait
		], callback);
	}

	// during the test, we send a message and wait for it to arrive
	run (callback) {
		Bound_Async.series(this, [
			this.listen_on_client,
			this.send_from_server,
			this.wait_for_message,
			this.clear_timer
		], callback);
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
		client_config.authKey = this.current_user._id;
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

	// begin listening to on the client
	listen_on_client (callback) {
		this.message_timer = setTimeout(
			this.message_timeout.bind(this, this.channel_name),
			this.timeout || 5000
		);
		this.pubnub_for_client.subscribe(
			this.channel_name,
			this.message_received.bind(this),
			callback
		);
	}

	// wait for permissions to be set through pubnub PAM
	wait (callback) {
		setTimeout(callback, 2000);
	}

	// called if message doesn't arrive after timeout
	message_timeout (channel) {
		Assert.fail('message never arrived for ' + channel);
	}

	// called when a message has been received, assert that it matches expectations
	message_received (error, message) {
		if (error) { return this.message_callback(error); }
		Assert(message.channel === this.channel_name, 'received message doesn\'t match channel name');
		Assert(message.message === this.message, 'received message doesn\'t match');

		// the message can actually arrive before we are waiting for it, so in that case signal that we already got it
		if (this.message_callback) {
			this.message_callback();
		}
		else {
			this.message_already_received = true;
		}
	}

	// send a random message from the server
	send_from_server (callback) {
		this.message = Random_String.generate(100);
		this.pubnub_for_server.publish(
			this.message,
			this.channel_name,
			callback
		);
	}

	// wait for the message to arrive
	wait_for_message (callback) {
		if (this.message_already_received) {
			return callback();
		}
		else {
			this.message_callback = callback;
			// do nothing until we get the message or a timeout...
		}
	}

	// clear out timer
	clear_timer (callback) {
		if (this.message_timer) {
			clearTimeout(this.message_timer);
			delete this.message_timer;
 		}
		callback();
	}
}

module.exports = CodeStream_Message_Test;
