'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class StreamChannelACLTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		Object.assign(this.streamOptions, {
			creatorIndex: 1,
			members: []
		});
	}

	get description () {
		return 'should get an error when trying to subscribe to a stream channel for a stream i am not a member of';
	}

	// set the channel name to listen on
	setChannelName (/*callback*/) {
		throw 'stream channels are deprecated';
		/*
		// listening on the stream channel for this stream
		this.channelName = 'stream-' + this.stream.id;
		callback();
		*/
	}
}

module.exports = StreamChannelACLTest;
