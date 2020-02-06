'use strict';

const GetChangesetsTest = require('./get_changesets_test');

class ReviewIDRequiredTest extends GetChangesetsTest {

	get description () {
		return 'should return an error if getting changesets without providing a review ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'reviewId'
		};
	}

	// get query parameters to use for the test
	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		// eliminate the parameter in question for this test
		delete queryParameters.reviewId;
		return queryParameters;
	}
}

module.exports = ReviewIDRequiredTest;
