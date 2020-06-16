'use strict';

const ArchiveClearUnreadsMessageTest = require('./archive_clear_unreads_message_test');

class ArchiveClearUnreadsForTeamStreamMessageTest extends ArchiveClearUnreadsMessageTest {

	get description () {
		return 'when a team stream is archived, all users in the team should receive a message to clear lastReads for the stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}
}

module.exports = ArchiveClearUnreadsForTeamStreamMessageTest;
