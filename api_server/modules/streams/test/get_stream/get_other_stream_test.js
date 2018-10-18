'use strict';

const GetStreamTest = require('./get_stream_test');

class GetOtherStreamTest extends GetStreamTest {

	constructor (options) {
		super(options);
		this.streamOptions.creatorIndex = 1;
	}
	
	get description () {
		return `should return a valid stream when requesting a ${this.type} stream created by someone else on my team`;
	}
}

module.exports = GetOtherStreamTest;
