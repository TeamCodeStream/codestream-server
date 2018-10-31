'use strict';

const PutStreamFetchTest = require('./put_stream_fetch_test');

class CloseStreamTest extends PutStreamFetchTest {

	get description () {
		return 'should return the updated stream with isClosed set when setting a stream to closed';
	}

	// get the data for the stream update
	getUpdateData () {
		return {
			isClosed: true
		};
	}
}

module.exports = CloseStreamTest;
