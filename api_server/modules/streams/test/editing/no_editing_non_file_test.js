'use strict';

var EditingTest = require('./editing_test');
var Assert = require('assert');

class NoEditingNonFileTest extends EditingTest {

	get description () {
		return `should return an empty response when trying to set editing for a ${this.type} stream`;
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { streams: [] }, 'expected empty streams');
	}

}

module.exports = NoEditingNonFileTest;
