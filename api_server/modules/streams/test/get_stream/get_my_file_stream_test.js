'use strict';

var GetStreamTest = require('./get_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class GetMyFileStreamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		this.type = 'file';
		this.mine = true;
	}
	
	get description () {
		return 'should return a valid stream when requesting a file stream created by me';
	}

	getExpectedFields () {
		return { stream: [
			...StreamTestConstants.EXPECTED_STREAM_FIELDS,
			...StreamTestConstants.EXPECTED_FILE_STREAM_FIELDS
		] };
	}
}

module.exports = GetMyFileStreamTest;
