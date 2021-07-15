'use strict';

const ReviewMarkersTest = require('./review_markers_test');

class ReviewersTest extends ReviewMarkersTest {

	constructor (options) {
		super(options);
		this.expectMarkers = 2;
		this.expectStreamMarkers = 3;
	}

	get description () {
		return 'should return a valid review when creating a post with a review with an array of valid reviewers';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 3;
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.reviewers = [this.users[1].user.id, this.users[2].user.id];
			this.expectedFollowerIds = [this.currentUser.user.id, ...this.data.review.reviewers];
			callback();
		});
	}
}

module.exports = ReviewersTest;
