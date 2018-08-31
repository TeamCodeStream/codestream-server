'use strict';

const ArchiveClearUnreadsMessageTest = require('./archive_clear_unreads_message_test');

class ArchiveClearUnreadsForTeamStreamMessageTest extends ArchiveClearUnreadsMessageTest {

	constructor (options) {
		super(options);
		this.isTeamStream = true;
	}

	get description () {
		return 'when a team stream is archived, all users in the team should receive a message to clear lastReads for the stream';
	}
}

module.exports = ArchiveClearUnreadsForTeamStreamMessageTest;
