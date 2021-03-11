'use strict';

const GetReviewsWithMarkersTest = require('./get_reviews_with_markers_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class GetReviewsByStreamIdTest extends GetReviewsWithMarkersTest {

	get description () {
		return 'should return the correct reviews when requesting reviews for a team and by stream ID';
	}


	setPath (callback) {
		// set path, but create another stream with some more posts, and make sure we don't see
		// any of those posts
		BoundAsync.series(this, [
			super.setPath,
			this.createOtherStream,
			this.createOtherPosts,
		], callback);
	}

	createOtherStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherStream = response.stream;
				this.path = `/reviews?teamId=${this.team.id}&streamId=${this.teamStream.id}`;
				callback();
			},
			{
				teamId: this.team.id,
				type: 'channel',
				token: this.users[1].accessToken
			}
		);
	}

	createOtherPosts (callback) {
		BoundAsync.timesSeries(
			this,
			5,
			this.createOtherPost,
			callback
		);
	}

	createOtherPost (n, callback) {
		this.postFactory.createRandomPost(
			callback,
			{
				streamId: this.otherStream.id,
				token: this.users[1].accessToken,
				wantReview: true,
				numChanges: 2,
				changesetRepoId: this.repo.id
			}
		);
	}
	
	// validate correct response
	validateResponse (data) {
		data.reviews.forEach(review => {
			Assert.strictEqual(review.streamId, this.teamStream.id, 'got a review with non-matching stream ID');
		});
		super.validateResponse(data);
	}
}

module.exports = GetReviewsByStreamIdTest;
