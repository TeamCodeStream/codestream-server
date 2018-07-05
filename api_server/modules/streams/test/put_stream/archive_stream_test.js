'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');

class ArchiveStreamTest extends PutStreamFetchTest {

	get description () {
		return 'should return the updated stream with isArchived set when archiving a stream';
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			isArchived: true
		};
	}
}

module.exports = ArchiveStreamTest;
