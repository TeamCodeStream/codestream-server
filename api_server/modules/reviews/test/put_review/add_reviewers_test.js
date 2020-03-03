'use strict';

const AddReviewerTest = require('./add_reviewer_test');

class AddReviewersTest extends AddReviewerTest {

	get description () {
		return 'should return the updated review and correct directive when adding multiple reviewers to a review';
	}
   
	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.numAdditionalInvites = 2;
			this.userOptions.numRegistered = 4;
			callback();
		});
	}

	// get the users we want to add to the reviewer
	getAddedUsers () {
		return this.users.slice(2).map(user => user.user);
	}
}

module.exports = AddReviewersTest;
