'use strict';

const EditingTest = require('./editing_test');
const Assert = require('assert');

class AlreadyEditingTest extends EditingTest {

	constructor (options) {
		super(options);
		this.wantAlreadyEditing = true;
	}

	get description () {
		return 'should do nothing and return an empty response when the user indicates they are not editing a file that they have already indicated they are editing';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { streams: [] }, 'expected empty streams');
	}
}

module.exports = AlreadyEditingTest;
