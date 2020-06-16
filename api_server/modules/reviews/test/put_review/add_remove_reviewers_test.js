'use strict';

const PutReviewTest = require('./put_review_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AddRemoveReviewersTest extends PutReviewTest {

	get description () {
		return 'should return the updated review and directive to both add and remove when adding and removing reviewers to/from a review';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 7;
			callback();
		});
	}

	// form the data for the review update
	makeReviewUpdateData (callback) {
		this.expectedVersion++;
		BoundAsync.series(this, [
			super.makeReviewUpdateData,
			this.addReviewers,
			this.setReviewersToAddAndRemove
		], callback);
	}

	addReviewers (callback) {
		// add the first three users
		const addedUserIds = this.users.slice(1, 4).map(user => user.user.id);
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/' + this.review.id,
				data: {
					$addToSet: {
						reviewers: addedUserIds
					}
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.review.reviewers = response.review.$addToSet.reviewers;
				this.review.followerIds = [this.review.creatorId, ...response.review.$addToSet.followerIds];
				callback();
			}
		);
	}

	setReviewersToAddAndRemove (callback) {
		this.addUserIds = [this.users[4].user.id, this.users[6].user.id];
		this.data.$addToSet = { reviewers: this.addUserIds };
		this.expectedData.review.$addToSet = { 
			reviewers: this.addUserIds,
			followerIds: this.addUserIds
		};
		this.removeUserIds = [this.users[1].user.id, this.users[3].user.id];
		this.data.$pull = { reviewers: this.removeUserIds };
		this.expectedData.review.$pull = { reviewers: this.removeUserIds };
		callback();
	}
}

module.exports = AddRemoveReviewersTest;
