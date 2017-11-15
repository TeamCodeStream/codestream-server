'use strict';

var PubNubTest = require('./pubnub_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class RevokeAccessTest extends PubNubTest {

	get description () {
		return 'client should get an error when trying to subscribe to a channel for which read access has been revoked';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.removeListener,
			this.revokeAccess,
			this.wait,
			this.listenAgain
		], callback);
	}

	removeListener (callback) {
		this.pubnubForClient.removeListener(this.channelName);
		callback();
	}

	revokeAccess (callback) {
		this.pubnubForServer.revoke(
			this.authKey,
			[this.channelName],
			callback
		);
	}

	wait (callback) {
		// there can be some delay between when access is revoked and when the channel can become unsubscribed;
		// we want to test that the channel becomes unsubscribable without explicit unsubscribing and resubscibing,
		// so we inroduce an artificial delay
		setTimeout(callback, 5000);
	}

	listenAgain (callback) {
		this.pubnubForClient.subscribe(
			this.channelName,
			this.unexpectedMessageReceived.bind(this),
			error => {
				Assert(error.error, 'error expected');
				Assert(error.operation === 'PNSubscribeOperation' || error.operation === 'PNHeartbeatOperation',
					'operation expected to be PNSubscribeOperation');
				Assert(error.category === 'PNAccessDeniedCategory', 'category expected to be PNAccessDeniedCategory');
				callback();
			}
		);
	}

	unexpectedMessageReceived () {
		Assert.fail('message should not be received on this channel');
	}
}

module.exports = RevokeAccessTest;
