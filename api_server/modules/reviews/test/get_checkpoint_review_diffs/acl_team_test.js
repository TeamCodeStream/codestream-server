'use strict';

const GetCheckpointReviewDiffsTest = require('./get_checkpoint_review_diffs_test');

class ACLTeamTest extends GetCheckpointReviewDiffsTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
		this.teamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch checkpoint diffs for a review from a ${this.type} stream from a team that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTeamTest;
