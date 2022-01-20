'use strict';

const ReopenTest = require('./reopen_test');
const ObjectId = require('mongodb').ObjectId;

class ReviewNotFoundTest extends ReopenTest {

	get description () {
		return 'should return an error when trying to reopen a non-existent review';
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
			this.path = `/reviews/reopen/${ObjectId()}`;
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
