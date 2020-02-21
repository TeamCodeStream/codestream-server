'use strict';

const PutReviewTest = require('./put_review_test');
const Assert = require('assert');

class NoUpdateOtherAttributeTest extends PutReviewTest {

	get description () {
		return `should not update ${this.attribute} even if sent in the request to update a review`;
	}

	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(error => {
			if (error) { return callback(error); }
			this.data[this.attribute] = 'x'; // set bogus value for the attribute, it shouldn't matter
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const set = data.review.$set;
		Assert(set[this.attribute] === undefined, 'attribute appears in the response');
		super.validateResponse(data);
	}
}

module.exports = NoUpdateOtherAttributeTest;
