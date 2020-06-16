'use strict';

const ReviewTest = require('./review_test');

class ReviewMarkersTest extends ReviewTest {

	constructor (options) {
		super(options);
		this.expectMarkers = 5;
	}

	get description () {
		return 'should return the post with a review and markers when creating a post with code review info and marker info';
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.markers = this.markerFactory.createRandomMarkers(
				this.expectMarkers,
				{
					fileStreamId: this.repoStreams[0].id,
					commitHash: this.useCommitHash
				}
			);
			callback();
		});
	}
}

module.exports = ReviewMarkersTest;
