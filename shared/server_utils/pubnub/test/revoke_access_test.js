'use strict';

var PubNubTest = require('./pubnub_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RevokeAccessTest extends PubNubTest {

	get description () {
		return 'client should get an error when trying to subscribe to a channel for which read access has been revoked';
	}

	// run the test...
	run (callback) {
		BoundAsync.series(this, [
			super.run,				// run the standard send/receive test
			this.removeListener,	// now remove our listener so we don't get any more messages
			this.revokeAccess,		// revoke our access to the channel
			this.wait,				// wait for the revocation to take effect
			this.listenAgain		// now listen again, we should NOT get a message
		], callback);
	}

	// remove the client listener for the channel
	removeListener (callback) {
		this.pubnubForClients[0].removeListener(this.channelName);
		callback();
	}

	// revoke the client pubnub's access to this channel
	revokeAccess (callback) {
		this.pubnubForServer.revoke(
			this.authKeys[0],
			[this.channelName],
			callback
		);
	}

	// wait for a bit
	wait (callback) {
		// there can be some delay between when access is revoked and when the channel can become unsubscribed;
		// we want to test that the channel becomes unsubscribable without explicit unsubscribing and resubscibing,
		// so we inroduce an artificial delay
		setTimeout(callback, 10000);
	}

	// try to subscribe again, this should fail because permission has been revoked
	listenAgain (callback) {
		this.pubnubForClients[0].subscribe(
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

	// if we get a message, something went wrong
	unexpectedMessageReceived () {
		Assert.fail('message should not be received on this channel');
	}
}

module.exports = RevokeAccessTest;
