'use strict';

const DeleteNRCommentTest = require('./delete_nr_comment_test');

class DeleteClaimedNRCommentTest extends DeleteNRCommentTest {

	get description () {
		return 'should deactivate a New Relic comment when requested through the comment engine, even if the comment is part of a code error claimed by the current team';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.claimCodeError(callback);
		});
	}
}

module.exports = DeleteClaimedNRCommentTest;
