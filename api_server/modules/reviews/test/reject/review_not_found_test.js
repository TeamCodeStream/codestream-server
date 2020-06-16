'use strict';

const RejectTest = require('./reject_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends RejectTest {

	get description () {
		return 'should return an error when trying to reject a non-existent review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'review'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent review
			this.path = `/reviews/reject/${ObjectID()}`;
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
