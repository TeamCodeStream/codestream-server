'use strict';

const PermalinkTest = require('./permalink_test');
const Assert = require('assert');

class DuplicateLinkTest extends PermalinkTest {

	constructor (options) {
		super(options);
		this.codemarkType = 'link';
	}

	get description () {
		return 'when creating a link for a codemark with attributes matching an existing link, should find the created link instead of creating a new one';
	}

	run (callback) {
		// we'll run the test twice, but on the second run, we expect the codemark returned to match the first
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
		Assert.equal(data.codemark.id, this.firstRunCodemarkId, 'codemark on second run expected to be duplicate');
	}
}

module.exports = DuplicateLinkTest;
