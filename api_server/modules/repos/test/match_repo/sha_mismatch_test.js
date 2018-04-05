'use strict';

var ExactMatchTest = require('./exact_match_test');

class ShaMismatchTest extends ExactMatchTest {

	get description () {
		return 'should return error when an exact repo match is found but the hash of the first commit is incorrect';
	}

	getExpectedError () {
		return {
			code: 'REPO-1000'
		};
	}

	// get query parameters used to make the path
	getQueryParameters () {
		// substitute a different commit hash in the request
		const queryParameters = super.getQueryParameters();
		queryParameters.firstCommitHash = this.repoFactory.randomCommitHash();
		return queryParameters;
	}
}

module.exports = ShaMismatchTest;
