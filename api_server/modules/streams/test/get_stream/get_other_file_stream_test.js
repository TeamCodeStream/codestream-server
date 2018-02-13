'use strict';

var GetStreamTest = require('./get_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class GetOtherFileStreamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		this.type = 'file';
		this.mine = false;
	}
	
	get description () {
		return 'should return a valid stream when requesting a file stream created by someone else on my team';
	}

	getExpectedFields () {
		return { stream: [
			...StreamTestConstants.EXPECTED_STREAM_FIELDS,
			...StreamTestConstants.EXPECTED_FILE_STREAM_FIELDS
		] };
	}
}

module.exports = GetOtherFileStreamTest;
