'use strict';

const ReviewMarkersTest = require('./review_markers_test');

class ReviewMarkersNotArrayTest extends ReviewMarkersTest {

	get description () {
		return 'should return an error when attempting to create a post and review with markers attribute that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: must be an array of objects'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use a "numeric" markers structure ... not allowed!
		super.makePostData(() => {
			this.data.review.markers = 1;
			callback();
		});
	}
}

module.exports = ReviewMarkersNotArrayTest;
