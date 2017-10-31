'use strict';

var PubNub_Test = require('./pubnub_test');
var Assert = require('assert');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Revoke_Access_Test extends PubNub_Test {

	get description () {
		return 'client should get an error when trying to subscribe to a channel for which read access has been revoked';
	}

	run (callback) {
		Bound_Async.series(this, [
			super.run,
			this.remove_listener,
			this.revoke_access,
			this.listen_again
		], callback);
	}

	remove_listener (callback) {
		this.pubnub_for_client.remove_listener(this.channel_name);
		callback();
	}

	revoke_access (callback) {
		this.pubnub_for_server.revoke(
			this.auth_key,
			[this.channel_name],
			callback
		);
	}

	listen_again (callback) {
		this.pubnub_for_client.subscribe(
			this.channel_name,
			this.unexpected_message_received.bind(this),
			error => {
				Assert(error.error, 'error expected');
				Assert(error.operation === 'PNSubscribeOperation' || error.operation === 'PNHeartbeatOperation',
					'operation expected to be PNSubscribeOperation');
				Assert(error.category === 'PNAccessDeniedCategory', 'category expected to be PNAccessDeniedCategory');
				callback();
			}
		);
	}

	unexpected_message_received () {
		Assert.fail('message should not be received on this channel');
	}
}

module.exports = Revoke_Access_Test;
