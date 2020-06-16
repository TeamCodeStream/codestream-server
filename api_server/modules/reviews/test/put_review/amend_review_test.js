'use strict';

const PutReviewTest = require('./put_review_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class AmendReviewTest extends PutReviewTest {

	get description () {
		return 'should be able to amend a review with new changesets';
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		this.amendedChangesetData = this.reviewFactory.getRandomChangesets(2, {
			changesetRepoIds: this.repos.map(repo => repo.id)
		});
		data.$addToSet = {
			reviewChangesets: DeepClone(this.amendedChangesetData)
		};
		return data;
	}

	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(error => {
			if (error) { return callback(error); }
			delete this.expectedData.review.$set.$addToSet; 
			delete this.expectedData.review.$set.$push;
			this.expectedData.review.$addToSet = {
				reviewChangesets: DeepClone(this.amendedChangesetData)
			};
			this.expectedData.review.$addToSet.reviewChangesets.forEach(rcs => {
				delete rcs.diffs;
			});
			this.expectedData.review.$unset = {
				approvedAt: true,
				approvedBy: true
			};
			callback();
		});
	}
}

module.exports = AmendReviewTest;
