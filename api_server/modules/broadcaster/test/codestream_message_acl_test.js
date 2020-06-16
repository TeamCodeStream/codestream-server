'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');
const Assert = require('assert');

class CodeStreamMessageACLTest extends CodeStreamMessageTest {

	// run the test...
	run (callback) {
		(async () => {
			// try to subscribe to the channel of interest, but we expect this to fail
			const user = this.users[0].user;
			try {
				await this.broadcasterClientsForUser[user.id].subscribe(
					this.channelName,
					() => {
						Assert.fail('message received');
					}
				);
				Assert.fail('subscribe was successful, but should not have been');
			}
			catch (error) {
				return callback();
			}
		})();
	}
}

module.exports = CodeStreamMessageACLTest;
