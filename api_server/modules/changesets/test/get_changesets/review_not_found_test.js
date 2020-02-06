'use strict';

const GetChangesetsTest = require('./get_changesets_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends GetChangesetsTest {

	get description () {
		return 'should return an error when trying to fetch changesets for a review that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'review'
		};
	}

	// get query parameters to use for the test
	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		// set the review ID to an ID that doesn't exist
		queryParameters.reviewId = ObjectID();
		return queryParameters;
	}
}

module.exports = ReviewNotFoundTest;
