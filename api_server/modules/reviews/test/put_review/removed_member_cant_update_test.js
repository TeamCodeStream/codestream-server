'use strict';

const PutReviewTest = require('./put_review_test');

class RemovedMemberCantUpdateTest extends PutReviewTest {

	get description () {
		return 'should return an error when the a user tries to update a review that they are the author of, but they have been removed from the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user must be on the team that owns the review'
		};
	}

	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(error => {
			if (error) { return callback(error); }
			this.removeUserFromTeam(callback);
		});
	}

	removeUserFromTeam (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: {
					$push: {
						removedMemberIds: this.currentUser.user.id
					}
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}
}

module.exports = RemovedMemberCantUpdateTest;
