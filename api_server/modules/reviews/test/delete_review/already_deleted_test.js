'use strict';

const DeleteReviewTest = require('./delete_review_test');

class AlreadyDeletedTest extends DeleteReviewTest {

	get description () {
		return 'should return an error when trying to delete a review that has already been deleted';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1014'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the review, ahead of time...
			this.doApiRequest(
				{
					method: 'delete',
					path: '/reviews/' + this.review.id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = AlreadyDeletedTest;
