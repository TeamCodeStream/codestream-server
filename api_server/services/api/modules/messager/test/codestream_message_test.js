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
		this.pubnub_clients_for_user = {};
		Bound_Async.series(this, [
			this.make_data,
			this.make_pubnub_clients,
			this.set_channel_name,
			this.wait
		], callback);
	}

	// during the test, we send a message and wait for it to arrive
	run (callback) {
		Bound_Async.series(this, [
			this.listen_on_client,
			this.generate_message,
			this.wait_for_message,
			this.clear_timer
		], callback);
	}

	// establish the PubNub clients we will use to send and receive a message
	make_pubnub_clients (callback) {
		// set up the pubnub client as if we are the server
		this.make_pubnub_for_server();

		// set up a pubnub client as if we are a client for the current user
		this.make_pubnub_for_client(this.current_user);

		callback();
	}

	// set up the pubnub client as if we are the server
	make_pubnub_for_server () {
		// all we have to do here is provide the full config, which includes the secretKey
		let client = new PubNub(PubNub_Config);
		this.pubnub_for_server = new PubNub_Client({
			pubnub: client
		});
	}

	// set up the pubnub client as if we are a client, we can't control access rights in this case
	make_pubnub_for_client (user) {
		// we remove the secretKey, which clients should NEVER have, and the publishKey, which we won't be using
		let client_config = Object.assign({}, PubNub_Config);
		delete client_config.secretKey;
		delete client_config.publishKey;
		client_config.authKey = user._id;
		let client = new PubNub(client_config);
		this.pubnub_clients_for_user[user._id] = new PubNub_Client({
			pubnub: client
		});
	}

	// make whatever data we need to set up our messaging, this should be overridden for specific tests
	make_data (callback) {
		callback();
	}

	// set the channel name of interest, this should be overridden for specific tests
	set_channel_name (callback) {
		callback('set_channel_name should be overridden');
	}

	// wait for permissions to be set through pubnub PAM
	wait (callback) {
		setTimeout(callback, 2000);
	}

	// begin listening to on the client
	listen_on_client (callback) {
		this.message_timer = setTimeout(
			this.message_timeout.bind(this, this.channel_name),
			this.timeout || 5000
		);
		this.pubnub_clients_for_user[this.current_user._id].subscribe(
			this.channel_name,
			this.message_received.bind(this),
			callback
		);
	}

	// called if message doesn't arrive after timeout
	message_timeout (channel) {
		Assert.fail('message never arrived for ' + channel);
	}

	// called when a message has been received, assert that it matches expectations
	message_received (error, message) {
		if (error) { return this.message_callback(error); }
		Assert(message.channel === this.channel_name, 'received message doesn\'t match channel name');
		if (typeof message.message === 'object') {
			Assert(message.message.request_id, 'received message has no request_id');
			this.message.request_id = message.message.request_id;	// don't care what it is
		}
		Assert.deepEqual(message.message, this.message, 'received message doesn\'t match');

		// the message can actually arrive before we are waiting for it, so in that case signal that we already got it
		if (this.message_callback) {
			this.message_callback();
		}
		else {
			this.message_already_received = true;
		}
	}

	// generate the message, this could be overriden but by default it just sends a random message
	generate_message (callback) {
		this.send_from_server(callback);
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
