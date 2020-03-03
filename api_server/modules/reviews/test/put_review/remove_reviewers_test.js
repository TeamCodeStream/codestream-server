'use strict';

const RemoveReviewerTest = require('./remove_reviewer_test');

class RemoveReviewersTest extends RemoveReviewerTest {

	get description () {
		return 'should return the updated review and correct directive when removing multiple reviewers from a review';
	}
   
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 2;
			this.userOptions.numRegistered = 4;
			callback();
		});
	}

	// get the reviewers we want to remove from the review
	getRemovedReviewers () {
		return this.users.slice(3).map(user => user.user);
	}
}

module.exports = RemoveReviewersTest;
