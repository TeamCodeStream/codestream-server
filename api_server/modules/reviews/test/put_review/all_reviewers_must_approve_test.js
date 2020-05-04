'use strict';

const PutReviewTest = require('./put_review_test');

class AllReviewersMustApproveTest extends PutReviewTest {

	get description () {
		return 'should be able to set the allReviewersMustApprove flag';
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		data.allReviewersMustApprove = true;
		return data;
	}
}

module.exports = AllReviewersMustApproveTest;
