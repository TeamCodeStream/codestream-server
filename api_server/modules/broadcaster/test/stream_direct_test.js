'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');

class StreamDirectTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.wantServer = true;	// want a simulated server to send a message
		this.streamOptions.creatorIndex = 0;
		this.streamOptions.type = 'direct';
	}

	get description () {
		return 'should be able to subscribe to and receive a message from the stream channels for all my direct streams as a confirmed user';
	}

	// set the channel name to listen on
	setChannelName (callback) {
		throw 'stream channels are deprecated';
		/*
		// listening on the stream channel for this stream
		this.channelName = 'stream-' + this.stream.id;
		callback();
		*/
	}
}

module.exports = StreamDirectTest;
