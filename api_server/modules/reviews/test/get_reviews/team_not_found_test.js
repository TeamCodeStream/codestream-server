'use strict';

const GetReviewsTest = require('./get_reviews_test');
const ObjectId = require('mongodb').ObjectId;

class TeamNotFoundTest extends GetReviewsTest {

	get description () {
		return 'should return an error when trying to fetch reviews from a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009',
			reason: 'user not on team'
		};
	}

	setPath (callback) {
		// set teamId to team that doesn't exist
		this.path = '/reviews?teamId=' + ObjectId();
		callback();
	}
}

module.exports = TeamNotFoundTest;
