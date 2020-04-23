'use strict';

const ApproveTest = require('./approve_test');
const Assert = require('assert');

class AlreadyApprovedTest extends ApproveTest {

	get description () {
		return 'should return directive to update just the approvedAt if user approves a review they have already approved';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.secondRun = true;
			delete this.expectedResponse.review.$set[`approvedBy.${this.currentUser.user.id}`];
			this.expectedResponse.review.$set[`approvedBy.${this.currentUser.user.id}.approvedAt`] = Date.now();
			this.expectedResponse.review.$set.version = 3;
			this.expectedResponse.review.$version = {
				before: 2,
				after: 3
			};
			super.run(callback);
		});
	}

	validateResponse (data) {
		if (!this.secondRun) {
			return super.validateResponse(data);
		}

		// verify modifiedAt was updated, and then set it so the deepEqual works
		const review = data.review;
		const key = `approvedBy.${this.currentUser.user.id}.approvedAt`;
		Assert(review.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the review was updated');
		this.expectedResponse.review.$set.modifiedAt = review.$set.modifiedAt;
		Assert(review.$set[key] >= this.modifiedAfter, 'approvedAt is not greater than before the review was updated');
		this.expectedResponse.review.$set[key] = review.$set[key];
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = AlreadyApprovedTest;
