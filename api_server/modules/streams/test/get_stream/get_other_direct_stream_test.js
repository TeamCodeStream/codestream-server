'use strict';

var GetStreamTest = require('./get_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class GetOtherDirectStreamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		this.type = 'direct';
		this.mine = false;
	}
	
	get description () {
		return 'should return a valid stream when requesting a direct stream created by someone else on my team';
	}

	getExpectedFields () {
		return { stream: [
			...StreamTestConstants.EXPECTED_STREAM_FIELDS,
			...StreamTestConstants.EXPECTED_DIRECT_STREAM_FIELDS
		] };
	}
}

module.exports = GetOtherDirectStreamTest;
