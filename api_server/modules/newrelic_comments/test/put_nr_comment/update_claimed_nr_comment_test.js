'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');

class UpdateClaimedNRCommentTest extends UpdateNRCommentTest {

	get description () {
		return 'should return a New Relic comment when an update is made through the comment engine, even if the comment is part of a code error claimed by the current team';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.claimCodeError(callback);
		});
	}
}

module.exports = UpdateClaimedNRCommentTest;
