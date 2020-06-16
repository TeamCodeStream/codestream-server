'use strict';

const GetReviewsTest = require('./get_reviews_test');

class NoLastActivityAtAndStreamIdTest extends GetReviewsTest {

	constructor (options) {
		super(options);
		this.repoOptions.creatorIndex = 1;
	}
	
	get description () {
		return 'should return error if byLastActivityAt and streamId are provided to reviews query at the same time';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = `/reviews?teamId=${this.team.id}&streamId=${this.stream.id}&byLastActivityAt=1`;
		callback();
	}
}

module.exports = NoLastActivityAtAndStreamIdTest;
