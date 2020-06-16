'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return `members of a ${this.streamType} stream should receive a message with the proper directive when a post is reacted to`;
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the stream channel
		this.channelName = `stream-${this.stream.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// execute the reaction, this should trigger a message to the stream channel
		this.doApiRequest(
			{
				method: 'put',
				path: '/react/' + this.post.id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = MessageTest;
