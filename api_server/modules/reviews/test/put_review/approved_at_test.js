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
		Assert.equal(data.review.$set.approvedAt, data.review.$set.modifiedAt, 'approvedAt should be equal to modifiedAt');
		this.expectedData.review.$set.approvedAt = data.review.$set.approvedAt;
		super.validateResponse(data);
	}
}

module.exports = ApprovedAtTest;
