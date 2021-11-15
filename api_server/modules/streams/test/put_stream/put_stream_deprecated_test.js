'use strict';

const PutStreamTest = require('./put_stream_test');

class PutStreamDeprecatedTest extends PutStreamTest {

	get description () {
		return `should return error when attempting to update a stream, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = PutStreamDeprecatedTest;
