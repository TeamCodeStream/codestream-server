'use strict';

const DeleteReviewTest = require('./delete_review_test');

class ACLTest extends DeleteReviewTest {

	get description () {
		return 'should return an error when trying to delete a review authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the author or a team admin can delete the review'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTest;
