'use strict';

const DeleteMarkersTest = require('./delete_markers_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class DeleteMarkersFetchTest extends DeleteMarkersTest {

	get description () {
		return 'should delete associated markers when a review is deleted, checked by fetching the markers';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deleteReview	// perform the actual deletion
		], callback);
	}

	// totally override the normal test run to fetch the markers,
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

module.exports = DeleteMarkersFetchTest;
