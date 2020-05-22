'use strict';

var BasePubNubTest = require('./base_pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class PresenceTest extends BasePubNubTest {

	constructor (options) {
		super(options);
		this.numClients = 2;
		this.withPresence = true;
		this.messageReceiveTimeout = 10000;
	}

	get description () {
		return 'client should receive a join message when a second client subscribes to the same channel';
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
			this.waitForMessage,		// wait for it
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

	validateMessage (message) {
		if (
			message.channel === this.channelName &&
			message.action === 'join' &&
			message.uuid === this.uuids[1]
		) {
			return true;
		}
	}
}

module.exports = PresenceTest;
