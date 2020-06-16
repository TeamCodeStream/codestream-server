'use strict';

const TrackingTest = require('./tracking_test');

class TrackingReplyToReviewTest extends TrackingTest {

	get description () {
		return 'should send a Reply Created event for tracking purposes when handling a reply to a review via email';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 0,
				wantReview: true,
				wantMarkers: 1,
				wantCodemark: undefined
			});
			callback();
		});
	}

	validateMessage (message) {
		if (message.message.type !== 'track') {
			return false;
		}
		this.expectedParentId = this.expectedParentId || this.postData[0].review.id;
		this.expectedParentType = this.expectedParentType || 'Review';
		return super.validateMessage(message);
	}
}

module.exports = TrackingReplyToReviewTest;
