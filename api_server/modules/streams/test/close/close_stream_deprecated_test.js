'use strict';

const CloseTest = require('./close_test');

class CloseStreamDeprecatedTest extends CloseTest {

	get description () {
		return `should return error when attempting to close a stream, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = CloseStreamDeprecatedTest;
