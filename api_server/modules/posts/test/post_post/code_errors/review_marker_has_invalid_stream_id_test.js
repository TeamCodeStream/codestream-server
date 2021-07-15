'use strict';

const ReviewMarkersTest = require('./review_markers_test');

class ReviewMarkerHasInvalidStreamIdTest extends ReviewMarkersTest {

	get description () {
		return 'should return an error when attempting to create a post and review with a marker element where the stream ID is not a valid ID';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'marker stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a marker from a bogus stream ID
		super.makePostData(() => {
			this.data.review.markers[0].fileStreamId = 'x';
			callback();
		});
	}
}

module.exports = ReviewMarkerHasInvalidStreamIdTest;
