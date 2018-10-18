'use strict';

const CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class StreamChannelTeamACLTest extends CodeStreamMessageACLTest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 3;
		Object.assign(this.teamOptions, {
			creatorIndex: 1,
			members: [2]
		});
		Object.assign(this.streamOptions, {
			creatorIndex: 2,
			members: [1]
		});
	}

	get description () {
		return 'should get an error when trying to subscribe to a stream channel for a team i am not a member of';
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// listening on the stream channel for this stream
		this.channelName = 'stream-' + this.stream._id;
		callback();
	}
}

module.exports = StreamChannelTeamACLTest;
