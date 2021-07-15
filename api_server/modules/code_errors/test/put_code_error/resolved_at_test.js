'use strict';

const PutReviewTest = require('./put_review_test');
const Assert = require('assert');

class ResolvedAtTest extends PutReviewTest {

	get description () {
		return 'should update resolvedAt to current time when updating a review status to resolved';
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		data.status = 'resolved';
		return data;
	}

	validateResponse (data) {
		Assert(data.review.$set.resolvedAt >= this.modifiedAfter, 'resolvedAt is not greater than before the before was updated');
		this.expectedData.review.$set.resolvedAt = data.review.$set.resolvedAt;
		super.validateResponse(data);
	}
}

module.exports = ResolvedAtTest;
