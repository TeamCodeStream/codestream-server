'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class ClaimedTest extends GetNRCommentsTest {

	constructor (options) {
		super(options);
		this.claimAfter = 3;
	}

	get description () {
		return 'should return New Relic comments when requested, even if the parent object has been claimed by a team';
	}
}

module.exports = ClaimedTest;
