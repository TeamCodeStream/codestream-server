'use strict';

const GetCheckpointReviewDiffsTest = require('./get_checkpoint_review_diffs_test');

class LegacyReviewDiffsTest extends GetCheckpointReviewDiffsTest {

	get description () {
		return 'should return legacy review diffs in checkpoint review diffs format';
	}

	// set the path to use for the request
	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			this.path = `/reviews/checkpoint-diffs/${this.review.id}?_testLegacyResponse=1`;
			callback();
		});
	}
}

module.exports = LegacyReviewDiffsTest;
