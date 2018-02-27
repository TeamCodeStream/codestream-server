'use strict';

var EditingTest = require('./editing_test');

class NoEditingNonFileTest extends EditingTest {

	get description () {
		return `should return an error when trying to set editing for a ${this.type} stream`;
	}

	getExpectedError () {
		return {
			code: 'STRM-1005'
		};
	}
}

module.exports = NoEditingNonFileTest;
