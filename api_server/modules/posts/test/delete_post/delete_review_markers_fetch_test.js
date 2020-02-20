'use strict';

const DeleteReviewMarkersTest = require('./delete_review_markers_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class DeleteReviewMarkersFetchTest extends DeleteReviewMarkersTest {

	get description () {
		return 'should delete associated markers when a post with a review is deleted, checked by fetching the markers';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deletePost	// perform the actual deletion
		], callback);
	}

	// totally override the normal test run to fetch the three markers,
	// we'll then verify they've been deactivated
	run (callback) {
		this.fetchedMarkers = [];
		BoundAsync.timesSeries(
			this,
			this.postData[0].markers.length, 
			this.fetchMarker,
			() => {
				this.verifyMarkers(callback);
			}
		);
	}

	fetchMarker (n, callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/markers/' + this.postData[0].markers[n].id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.fetchedMarkers.push(response.marker);
				callback();
			}
		);
	}

	verifyMarkers (callback) {
		const numMarkers = this.postData[0].markers.length;
		Assert(this.fetchedMarkers.length === numMarkers, `should have fetched ${numMarkers} markers`);
		for (let i = 0; i < numMarkers; i++) {
			const marker = this.fetchedMarkers[i];
			Assert(marker.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was deleted');
			this.expectedMarkers[i].modifiedAt = marker.modifiedAt;
			Assert.deepEqual(marker, this.expectedMarkers[i], 'fetched marker does not match');
		}
		callback();
	}
}

module.exports = DeleteReviewMarkersFetchTest;
