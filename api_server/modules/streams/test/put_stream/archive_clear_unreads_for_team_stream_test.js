'use strict';

const ArchiveClearUnreadsTest = require('./archive_clear_unreads_test');

class ArchiveClearUnreadsForTeamStreamTest extends ArchiveClearUnreadsTest {

	constructor (options) {
		super(options);
		this.isTeamStream = true;
	}

	get description () {
		return 'when a team stream is archived, should clear lastReads for the stream for all members of the stream';
	}
}

module.exports = ArchiveClearUnreadsForTeamStreamTest;
