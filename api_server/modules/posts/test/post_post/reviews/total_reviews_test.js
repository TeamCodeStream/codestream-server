'use strict';

const MessageToAuthorTest = require('../message_to_author_test');

class TotalReviewsTest extends MessageToAuthorTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			this.repoOptions.creatorIndex = 2;
			callback();
		});
	}

	get description () {
		return 'the author of a post should receive a message indicating totalReviews incremented when creating a review';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.review = this.reviewFactory.getRandomReviewData({
				numChanges: 2,
				changesetRepoId: this.repo.id
			});
			this.expectedMessage.user.$set.totalReviews = 1;
			callback();
		});
	}
}

module.exports = TotalReviewsTest;
