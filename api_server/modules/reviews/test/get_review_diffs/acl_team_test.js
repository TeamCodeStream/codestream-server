'use strict';

const GetReviewDiffsTest = require('./get_review_diffs_test');

class ACLTeamTest extends GetReviewDiffsTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch diffs for a review from a team that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;
