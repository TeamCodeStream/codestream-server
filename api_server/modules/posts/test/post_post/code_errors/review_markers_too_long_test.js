'use strict';

const ReviewMarkersTest = require('./review_markers_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class ReviewMarkersTooLongTest extends ReviewMarkersTest {

	get description () {
		return 'should return an error when attempting to create a post and review with a markers array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'markers: array is too long'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// create an array of markers that is over the limit in size, by duplicating the marker
		super.makePostData(() => {
			const marker = this.data.review.markers[0];
			for (let i = 0; i < 1000; i++) {
				this.data.review.markers.push(DeepClone(marker));
			}
			callback();
		});
	}
}

module.exports = ReviewMarkersTooLongTest;
