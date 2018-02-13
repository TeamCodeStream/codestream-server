'use strict';

var GetStreamTest = require('./get_stream_test');
const StreamTestConstants = require('../stream_test_constants');

class GetMyChannelStreamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		this.type = 'channel';
		this.mine = true;
	}
	
	get description () {
		return 'should return a valid stream when requesting a channel stream created by me';
	}

	getExpectedFields () {
		return { stream: [
			...StreamTestConstants.EXPECTED_STREAM_FIELDS,
			...StreamTestConstants.EXPECTED_CHANNEL_STREAM_FIELDS
		] };
	}
}

module.exports = GetMyChannelStreamTest;
