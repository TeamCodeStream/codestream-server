'use strict';

const ApproveTest = require('./approve_test');

class AllReviewersMustApproveTest extends ApproveTest {

	constructor (options) {
		super(options);
		this.allReviewersMustApprove = true;
	}

	get description () {
		return 'should not set the status to approved when review is set as all-reviewers-must-approve and only one of the reviewers approves of the review';
	}

}

module.exports = AllReviewersMustApproveTest;
