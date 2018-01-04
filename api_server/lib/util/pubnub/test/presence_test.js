'use strict';

var BasePubNubTest = require('./base_pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');

class PresenceTest extends BasePubNubTest {

	constructor (options) {
		super(options);
		this.numClients = 2;
		this.withPresence = true;
	}

	get description () {
		return 'client should receive a join message when a second client subscribes to the same channel';
	}

	// the actual test execution
	run (callback) {
		BoundAsync.series(this, [
			this.listenOnClient,		// listen on one client pubnub for the presence message
			this.waitForJoin,			// wait a bit for the join message for the first client to pass
			this.subscribeOnOtherClient,	// have the other client subscribe to the channel
			this.waitForMessage,		// wait for it
			this.clearTimer				// clear the timer, so we don't trigger a failure
		], callback);
	}

	// wait for the join message for the first client to pass
	waitForJoin (callback) {
		setTimeout(callback, 5000);
	}

	// subscribe to our random channel on the second client
	subscribeOnOtherClient (callback) {
		delete this.gotMessage;
		this.pubnubForClients[1].subscribe(
			this.channelName,
			() => {},
			callback,
			{
				withPresence: true
			}
		);
	}

	validateMessage (message) {
		Assert(message.channel === this.channelName, 'received message doesn\'t match channel name');
		Assert(message.action === 'join', 'message action should be "join"');
		Assert(message.uuid === this.uuids[1], 'uuid does not match');
		return true;
	}
}

module.exports = PresenceTest;
