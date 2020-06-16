'use strict';

const ReviewMarkersTest = require('./review_markers_test');

class ReviewMarkerAttributeRequiredTest extends ReviewMarkersTest {

	get description () {
		return `should return an error when attempting to create a post and review with a marker element with no ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the marker attribute
		super.makePostData(() => {
			delete this.data.review.markers[0][this.attribute];
			callback();
		});
	}
}

module.exports = ReviewMarkerAttributeRequiredTest;
