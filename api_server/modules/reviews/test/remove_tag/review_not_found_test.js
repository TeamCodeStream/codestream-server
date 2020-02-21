'use strict';

const RemoveTagTest = require('./remove_tag_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends RemoveTagTest {

	get description () {
		return 'should return an error when trying to remove a tag from a non-existent review';
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
			this.path = `/reviews/${ObjectID()}/remove-tag`;
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
