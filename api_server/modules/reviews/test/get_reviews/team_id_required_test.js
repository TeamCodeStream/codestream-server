'use strict';

const GetReviewsTest = require('./get_reviews_test');

class TeamIDRequiredTest extends GetReviewsTest {

	get description () {
		return 'should return error if teamId is not provided to reviews query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = '/reviews';
		callback();
	}
}

module.exports = TeamIDRequiredTest;
