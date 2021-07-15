'use strict';

const ReviewTest = require('./review_test');
const Assert = require('assert');

class EntryPointTest extends ReviewTest {

	get description () {
		return 'should be able to provide an entry point when creating a review';
	}

	addReviewData (callback) {
		super.addReviewData(error => {
			if (error) { return callback(error); }
			this.data.review.entryPoint = `TEST ${this.testNum}`;
			callback();
		});
	}

	validateResponse (data) {
		Assert.strictEqual(data.review.entryPoint, `TEST ${this.testNum}`, 'entryPoint attribute not set');
		super.validateResponse(data);
	}
}

module.exports = EntryPointTest;
