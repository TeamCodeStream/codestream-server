'use strict';

var Generic_Test = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var PubNub_Client = require(process.env.CS_API_TOP + '/lib/util/pubnub/pubnub_client.js');
var PubNub_Config = require(process.env.CS_API_TOP + '/config/pubnub');
var PubNub = require('pubnub');
var Random_String = require('randomstring');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class PubNub_Test extends Generic_Test {

	get description () {
		return 'client should receive the correct message through PubNub after message is sent from server';
	}

	// called before the actual test
	before (callback) {
		this.channel_name = Random_String.generate(12);
		this.message = Random_String.generate(100);
		this.auth_key = Random_String.generate(12);
		Bound_Async.series(this, [
			this.set_clients,
			this.grant_access
		], callback);
	}

	// the actual test execution
	run (callback) {
		this.message_callback = callback;
		Bound_Async.series(this, [
			this.listen_on_client,
			this.send_random_from_server,
			this.clear_timer
		]);
	}

	// establish the PubNub clients we will use
	set_clients (callback) {
		// set up the pubnub client as if we are the server, this give us the right to set permissions
		// all we have to do here is provide the full config, which includes the secretKey
		let client = new PubNub(PubNub_Config);
		this.pubnub_for_server = new PubNub_Client({
			pubnub: client
		});

		// set up the pubnub client as if we are a client, we can't control access rights in this case
		// we remove the secretKey, which clients should NEVER have
		let client_config = Object.assign({}, PubNub_Config);
		delete client_config.secretKey;
		if (this.client_read_only) {
			delete client_config.publishKey;
		}
		client_config.authKey = this.auth_key;
		client = new PubNub(client_config);
		this.pubnub_for_client = new PubNub_Client({
			pubnub: client
		});
		callback();
	}

	// grant access for the auth key to subscribe
	grant_access (callback) {
		this.pubnub_for_server.grant(
			this.auth_key,
			[this.channel_name],
			callback
		);
	}

	// begin listening to our random channel on the client
	listen_on_client (callback) {
		this.message_timer = setTimeout(
			this.message_timeout.bind(this),
			this.timeout || 5000
		);
		this.pubnub_for_client.subscribe(
			this.channel_name,
			this.message_received.bind(this),
			callback
		);
	}

	// called if message doesn't arrive after timeout
	message_timeout () {
		Assert.fail('message never arrived');
	}

	// called when a message has been received, assert that it matches expectations
	message_received (error, message) {
		if (error) { return this.message_callback(error); }
		Assert(message.channel === this.channel_name, 'received message doesn\'t match channel name');
		Assert(message.message === this.message, 'received message doesn\'t match');
		this.message_callback();
	}

	// send a random message from the server
	send_random_from_server (callback) {
		this.pubnub_for_server.publish(
			this.message,
			this.channel_name,
			(error) => {
				if (error) { return callback(error); }
				// ... otherwise don't callback at all, wait for message reception
			}
		);
		callback();
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

module.exports = PubNub_Test;
