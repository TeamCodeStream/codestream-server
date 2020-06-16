'use strict';

const GetReviewsByLastActivityTest = require('./get_reviews_by_last_activity_test');

class GetReviewsBeforeAfterLastActivityTest extends GetReviewsByLastActivityTest {

	get description () {
		return 'should return the correct reviews in correct order when requesting reviews for a team and between last activity timestamps';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			// pick bracket points, then filter our expected reviews based on the brackets,
			// and specify the before and after parameters to fetch based on the brackets
			const beforePivot = this.expectedReviews[3].lastActivityAt;
			const afterPivot = this.expectedReviews[7].lastActivityAt;
			this.expectedReviews = this.expectedReviews.filter(review => review.lastActivityAt < beforePivot && review.lastActivityAt > afterPivot);
			this.path = `/reviews?teamId=${this.team.id}&byLastActivityAt=1&before=${beforePivot}&after=${afterPivot}`;
			callback();
		});
	}
}

module.exports = GetReviewsBeforeAfterLastActivityTest;
