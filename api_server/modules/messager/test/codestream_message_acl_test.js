'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');
const Assert = require('assert');

class CodeStreamMessageACLTest extends CodeStreamMessageTest {

	// run the test...
	run (callback) {
		// try to subscribe to the channel of interest, but we expect this to fail
		const user = this.users[0].user;
		this.pubnubClientsForUser[user._id].subscribe(
			this.channelName,
			() => {
				Assert.fail('message received');
			},
			(error) => {
				Assert(error, 'error not thrown trying to subscribe');
				callback();
			}
		);
	}
}

module.exports = CodeStreamMessageACLTest;
