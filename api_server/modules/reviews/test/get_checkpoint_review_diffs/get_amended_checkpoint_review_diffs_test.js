'use strict';

const GetCheckpointReviewDiffsTest = require('./get_checkpoint_review_diffs_test');

class GetAmendedCheckpointReviewDiffsTest extends GetCheckpointReviewDiffsTest {

	get description () {
		return 'should get the correct checkpoint diffs after creating a review then amending it with new changesets';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.amendReview(callback);
		});
	}
	
	amendReview (callback) {
		const changesetRepoIds = this.repos.map(repo => repo.id);
		const changesets = this.reviewFactory.getRandomChangesets(2, { changesetRepoIds });
		for (let changeset of changesets) {
			this.expectedData.push({
				repoId: changeset.repoId,
				checkpoint: 0,
				diffs: changeset.diffs
			});
		}

		const token = this.users[this.postOptions.creatorIndex].accessToken;
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/' + this.review.id,
				data: {
					$addToSet: {
						reviewChangesets: changesets
					}
				},
				token
			},
			callback
		);
	}
}

module.exports = GetAmendedCheckpointReviewDiffsTest;
