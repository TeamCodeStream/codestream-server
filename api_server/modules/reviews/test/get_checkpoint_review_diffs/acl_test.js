'use strict';

const GetCheckpointReviewDiffsTest = require('./get_checkpoint_review_diffs_test');

class ACLTest extends GetCheckpointReviewDiffsTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
	}

	get description () {
		return `should return an error when trying to fetch checkpoint diffs for a review from a ${this.type} stream that i'm not a member of`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTest;
