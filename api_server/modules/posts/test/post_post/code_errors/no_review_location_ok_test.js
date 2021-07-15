'use strict';

const ReviewMarkersTest = require('./review_markers_test');

class NoReviewLocationOkTest extends ReviewMarkersTest {

	get description () {
		return 'should accept the post and review and return them when no location is given with a marker';
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// completely remove the location, this is permitted
		super.makePostData(() => {
			delete this.data.review.markers[0].location;
			callback();
		});
	}
}

module.exports = NoReviewLocationOkTest;
