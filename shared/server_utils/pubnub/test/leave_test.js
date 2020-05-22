'use strict';

var BasePubNubTest = require('./base_pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class LeaveTest extends BasePubNubTest {

	constructor (options) {
		super(options);
		this.numClients = 2;
		this.withPresence = true;
		this.messageReceiveTimeout = 15000;
	}

	get description () {
		return 'client should receive a leave message when a second client unsubscribes from the same channel';
	}

	// the actual test execution
	run (callback) {
		if (this.config.whichBroadcastEngine !== 'pubnub') {
			return callback();
		}
		BoundAsync.series(this, [
			this.listenOnClient,		// listen on one client pubnub for the presence message
			this.waitForJoin,			// wait a bit for the join message for the first client to pass
			this.subscribeOnOtherClient,	// have the other client subscribe to the channel
			this.waitForDebounce,		// wait for presence debounce
			this.unsubscribeOnOtherClient,	// have the other client unsubscribe from the channel
			this.waitForMessage,		// wait for the leave message
			this.clearTimer				// clear the timer, so we don't trigger a failure
		], callback);
	}

	// wait for the join message for the first client to pass
	waitForJoin (callback) {
		setTimeout(callback, 3000);
	}

	// subscribe to our random channel on the second client
	subscribeOnOtherClient (callback) {
		(async () => {
			delete this.gotMessage;
			await this.pubnubForClients[1].subscribe(
				this.channelName,
				() => {},
				{
					withPresence: true
				}
			);
			callback();
		})();
	}

	// wait for the join message for the first client to pass
	waitForDebounce (callback) {
		setTimeout(callback, 3000);
	}

	// unsubscribe from our random channel on the second client
	unsubscribeOnOtherClient (callback) {
		delete this.gotMessage;
		this.pubnubForClients[1].unsubscribe(this.channelName);
		this.unsubscribed = true;
		callback();
	}

	// validate that the message received matches expectations
	validateMessage (message) {
		if (!this.unsubscribed) {
			// not ready yet
			return false;
		}
		if (
			message.channel === this.channelName &&
			message.action === 'leave' &&
			message.uuid === this.uuids[1]
		) {
			return true;
		}
	}
}

module.exports = LeaveTest;
