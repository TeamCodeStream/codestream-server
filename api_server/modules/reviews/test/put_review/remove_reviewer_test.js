'use strict';

const PutReviewTest = require('./put_review_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RemoveReviewerTest extends PutReviewTest {

	get description () {
		return 'should return the updated review and directive when removing a reviewer from a review';
	}

	// form the data for the review update
	makeReviewUpdateData (callback) {
		this.expectedVersion++;
		BoundAsync.series(this, [
			super.makeReviewUpdateData,
			this.addReviewers,
			this.setReviewersToRemove
		], callback);
	}

	addReviewers (callback) {
		// just add everyone on the team
		const userIds = this.users.map(user => user.user.id);
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/' + this.review.id,
				data: {
					$addToSet: {
						reviewers: userIds
					}
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.review.reviewers = response.review.$addToSet.reviewers;
				callback();
			}
		);
	}

	setReviewersToRemove (callback) {
		// find one of the other reviewers in the review, and remove them 
		this.removedReviewers = this.getRemovedReviewers();
		this.expectedData.review.$pull = this.expectedData.review.$pull || {};
		if (this.removedReviewers.length === 1) {
			// this tests conversion of single element to an array
			const removedReviewer = this.removedReviewers[0];
			this.data.$pull = { reviewers: removedReviewer.id };
			this.expectedData.review.$pull.reviewers = [removedReviewer.id];
		}
		else {
			const removedReviewerIds = this.removedReviewers.map(reviewer => reviewer.id);
			this.data.$pull = { reviewers: removedReviewerIds };
			this.expectedData.review.$pull.reviewers = [...removedReviewerIds];
		}
		callback();
	}

	// get the reviewers we want to add to the review
	getRemovedReviewers () {
		return [this.users[2].user];
	}
}

module.exports = RemoveReviewerTest;
