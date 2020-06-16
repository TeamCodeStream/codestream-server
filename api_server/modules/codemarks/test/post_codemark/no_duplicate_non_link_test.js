'use strict';

const MarkerTest = require('./marker_test');
const Assert = require('assert');

class NoDuplicateNonLinkTest extends MarkerTest {

	get description () {
		return 'when creating a codemark, with properties and code block info the same, a new codemark (rather than an existing identical codemark) should be returned';
	}

	run (callback) {
		// we'll run the test twice, but on the second run, we expect the codemark returned to be different from the first
		super.run(error => {
			if (error) { return callback(error); }
			super.run(callback);
		});
	}

	validateResponse (data) {
		if (!this.secondRun) {
			this.secondRun = true;
			this.firstRunCodemarkId = data.codemark.id;
			return super.validateResponse(data);
		}
		Assert.notEqual(data.codemark.id, this.firstRunCodemarkId, 'codemark on second run was the same as on the first run');
	}
}

module.exports = NoDuplicateNonLinkTest;
