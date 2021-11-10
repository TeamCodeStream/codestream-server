'use strict';

const OpenTest = require('./open_test');

class OpenStreamDeprecatedTest extends OpenTest {

	get description () {
		return `should return error when attempting to open a stream, support is deprecated`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}
}

module.exports = OpenStreamDeprecatedTest;
