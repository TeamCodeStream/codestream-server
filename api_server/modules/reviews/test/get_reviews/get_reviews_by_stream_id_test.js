'use strict';

const GetReviewsWithMarkersTest = require('./get_reviews_with_markers_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

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
				this.path = `/reviews?teamId=${this.team.id}&streamId=${this.stream.id}`;
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
				changesetRepoId: this.repo.id
			}
		);
	}
	
	// validate correct response
	validateResponse (data) {
		data.reviews.forEach(review => {
			Assert.equal(review.streamId, this.stream.id, 'got a review with non-matching stream ID');
		});
		super.validateResponse(data);
	}
}

module.exports = GetReviewsByStreamIdTest;
