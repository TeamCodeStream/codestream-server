'use strict';

const EditingTest = require('./editing_test');
const Assert = require('assert');

class NoOpTest extends EditingTest {

	constructor (options) {
		super(options);
		this.dontWantExistingStream = true;
	}

	get description () {
		return 'should do nothing and return an empty response when the user indicates they are not editing a file and the file matches no stream';
	}

	// before the test runs...
	before (callback) {
		// run standard set up for the test but set editing to false, indicating
		// we're not really editing the file, which is a no-op
		super.before(() => {
			this.data.editing = false;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { streams: [] }, 'expected empty streams');
	}
}

module.exports = NoOpTest;
