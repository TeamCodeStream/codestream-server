'use strict';

var PubNubTest = require('./pubnub_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var RandomString = require('randomstring');

class MultipleHistoryTest extends PubNubTest {

	get description () {
		return 'should be able to retrieve missed messages for a channel';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.unsubscribe,
			this.wait,
			this.sendMoreMessages,
			this.fetchHistory
		], callback);
	}

	unsubscribe (callback) {
		this.pubnubForClient.unsubscribe(this.channelName);
		callback();
	}

	wait (callback) {
		setTimeout(callback, 2000);
	}

	sendMoreMessages (callback) {
		this.messages = [this.message];
		BoundAsync.timesSeries(
			this,
			10,
			this.sendMessage,
			callback
		);
	}

	sendMessage (n, callback) {
		let message = RandomString.generate(100);
		this.messages.push(message);
		this.pubnubForServer.publish(
			message,
			this.channelName,
			error => {
				if (error) { return callback(error); }
				setTimeout(callback, 1000);
			}
		);
	}

	fetchHistory (callback) {
		this.pubnubForClient.history(
			this.channelName,
			(error, messages) => {
				if (error) { return callback(error); }
				Assert(messages.length === this.messages.length, 'did not get expected number of messages');
				this.messages.forEach(message => {
					Assert(messages.find(receivedMessage => receivedMessage === message), 'did not find one of the sent messages in the history');
				});
				callback();
			}
		);
	}
}

module.exports = MultipleHistoryTest;
