'use strict';

const PutReviewTest = require('./put_review_test');

class ACLTest extends PutReviewTest {

	get description () {
		return 'should return an error when trying to update a review authored by someone else';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the creator of the review can make this update'
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
