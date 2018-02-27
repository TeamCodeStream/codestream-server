'use strict';

const MessageToTeamTest = require('./message_to_team_test');
const Assert = require('assert');

class NoMessageOnNoOpTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.dontWantExistingStream = true;
	}

	get description () {
		return 'no message should be sent when the user indicates they are not editing a file and the file matches no stream';
	}

	// before the test runs...
	init (callback) {
		// run standard set up for the test but set editing to false, indicating
		// we're not really editing the file, which is a no-op
		super.init(() => {
			this.data.editing = false;
			callback();
		});
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NoMessageOnNoOpTest;
