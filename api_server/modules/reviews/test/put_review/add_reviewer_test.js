'use strict';

const PutReviewTest = require('./put_review_test');

class AddReviewerTest extends PutReviewTest {

	get description () {
		return 'should return the updated review and directive when adding a reviewer to a review';
	}
   
	// form the data for the stream update
	makeReviewUpdateData (callback) {
		// find one of the other users in the team, and add them to the stream
		super.makeReviewUpdateData(() => {
			this.addedUsers = this.getAddedUsers();
			this.expectedData.review.$addToSet = this.expectedData.review.$addToSet || {};
			if (this.addedUsers.length === 1) {
				// this tests conversion of single element to an array
				const addedUser = this.addedUsers[0];
				this.data.$addToSet = { reviewers: addedUser.id };
				this.expectedData.review.$addToSet.reviewers = [addedUser.id];
				this.expectedData.review.$addToSet.followerIds = [addedUser.id];
			}
			else {
				const addedUserIds = this.addedUsers.map(user => user.id);
				this.data.$addToSet = { reviewers: addedUserIds };
				this.expectedData.review.$addToSet.reviewers = [...addedUserIds];
				this.expectedData.review.$addToSet.followerIds = [...addedUserIds];
			}
			this.expectedData.review.$addToSet.reviewers.sort();
			this.expectedData.review.$addToSet.followerIds.sort();
			callback();
		});
	}

	// get the users we want to add to the review
	getAddedUsers () {
		return [this.users[2].user];
	}

	// validate the response to the test request
	validateResponse (data) {
		data.review.$addToSet.reviewers.sort();
		data.review.$addToSet.followerIds.sort();
		super.validateResponse(data);
	}
}

module.exports = AddReviewerTest;
