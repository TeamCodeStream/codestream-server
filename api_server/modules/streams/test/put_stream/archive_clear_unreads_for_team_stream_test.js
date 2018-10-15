'use strict';

const ArchiveClearUnreadsTest = require('./archive_clear_unreads_test');

class ArchiveClearUnreadsForTeamStreamTest extends ArchiveClearUnreadsTest {

	get description () {
		return 'when a team stream is archived, should clear lastReads for the stream for all members of the stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.isTeamStream = true;
			callback();
		});
	}
}

module.exports = ArchiveClearUnreadsForTeamStreamTest;
