'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');
const Assert = require('assert');

class CodeStreamMessageACLTest extends CodeStreamMessageTest {

	// run the test...
	run (callback) {
		(async () => {
			// try to subscribe to the channel of interest, but we expect this to fail
			const nUser = this.listeningUserIndex || 0;
			const user = this.users[nUser].user;
			try {
				await this.broadcasterClientsForUser[user.id].subscribe(
					this.channelName,
					() => {
						Assert.fail('message received');
					}
				);
			} catch (error) {
				if (error.operation === 'PNSubscribeOperation' && error.category === 'PNAccessDeniedCategory') {
					return callback();
				} else {
					Assert.fail('error returned by subscribe was not correct');
				}
			}
			Assert.fail('subscribe was successful, but should not have been');
		})();
	}

	waitForRevoke (callback) {
		const wait = this.mockMode ? 0 : 1000;
		setTimeout(callback, wait);
	}
}

module.exports = CodeStreamMessageACLTest;
