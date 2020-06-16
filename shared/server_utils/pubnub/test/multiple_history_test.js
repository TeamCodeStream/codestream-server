'use strict';

var PubNubTest = require('./pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var Assert = require('assert');
var RandomString = require('randomstring');

// this test simulates what our client will do after a loss of connectivity event ...
// making sure we can retrieve multiple messages on a channel that were missed
class MultipleHistoryTest extends PubNubTest {

	get description () {
		return 'should be able to retrieve missed messages for a channel';
	}

	// run the test...
	run (callback) {
		// PubNubTest runs the test of sending and receiving a message, we'll
		// piggy-back on that test and send a bunch more messages, then fetch
		//  the history afterwards, making sure the fetched messages match expectations
		BoundAsync.series(this, [
			super.run,			// run the send/receive test
			this.unsubscribe,	// unsubscribe from the channel, which means we'll miss the messages
			this.wait,			// wait for the unsubscribe to take effect
			this.sendMoreMessages,	// now send more messages, which we'll miss because we're unsubscribed
			this.waitToFetch,	// wait some more for the messages to persist
			this.fetchHistory	// now fetch the history
		], callback);
	}

	// unsubscribe from the channel, we'll miss the messages from now on
	unsubscribe (callback) {
		this.pubnubForClients[0].unsubscribe(this.channelName);
		callback();
	}

	// wait for the unsubscribe to take effect
	wait (callback) {
		setTimeout(callback, 1000);
	}

	// send several more messages, which our client will miss
	sendMoreMessages (callback) {
		this.messages = [this.message];
		BoundAsync.timesSeries(
			this,
			10,
			this.sendMessage,
			callback
		);
	}

	// send a single message, and wait for a bit
	sendMessage (n, callback) {
		let message = RandomString.generate(100);
		this.messages.push(message);
		this.pubnubForServer.publish(
			message,
			this.channelName,
			error => {
				if (error) { return callback(error); }
				this.wait(callback);
			}
		);
	}

	// wait for the message to persist, i've found that several seconds are necessary
	waitToFetch (callback) {
		setTimeout(callback, 10000);
	}

	// fetch the history and ensure we get each message that was sent
	fetchHistory (callback) {
		this.pubnubForClients[0].history(
			this.channelName,
			(error, messages) => {
				if (error) { return callback(error); }
				Assert(messages.length === this.messages.length, 'did not get expected number of messages');
				this.messages.forEach(message => {
					// look for the received message among our messages, we should find a match for each
					Assert(messages.find(receivedMessage => receivedMessage === message), 'did not find one of the sent messages in the history');
				});
				callback();
			}
		);
	}
}

module.exports = MultipleHistoryTest;
