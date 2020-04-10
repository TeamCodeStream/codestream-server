'use strict';

const PutReviewTest = require('./put_review_test');
const Assert = require('assert');

class ApprovedAtTest extends PutReviewTest {

	get description () {
		return 'should update approvedAt to current time when updating a review status to approved';
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		data.status = 'approved';
		return data;
	}

	validateResponse (data) {
		Assert(data.review.$set.approvedAt >= this.modifiedAfter, 'approvedAt is not greater than before the before was updated');
		this.expectedData.review.$set.approvedAt = data.review.$set.approvedAt;
		super.validateResponse(data);
	}
}

module.exports = ApprovedAtTest;
