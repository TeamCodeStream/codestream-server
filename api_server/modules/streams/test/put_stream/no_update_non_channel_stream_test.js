'use strict';

const PutStreamTest = require('./put_stream_test');

class NoUpdateNonChannelStreamTest extends PutStreamTest {

	get description () {
		return `should return an error when trying to update a ${this.type} stream`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only channel streams can be updated'
		};
	}
}

module.exports = NoUpdateNonChannelStreamTest;
