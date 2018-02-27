'use strict';

var MessageToTeamTest = require('./message_to_team_test');

class MessageToTeamFindStreamTest extends MessageToTeamTest {

	get description () {
		return 'members of the team should receive a message with the correct op when a user indicates they are editing a file, when the file is specified by path';
	}

	// before the test runs...
	init (callback) {
		// run standard set up for the test but delete the streamId and provide matching file instead
		super.init(() => {
			delete this.data.streamId;
			this.data.file = this.stream.file;
			callback();
		});
	}
}

module.exports = MessageToTeamFindStreamTest;
