// base class for many tests of the "PUT /reviews/follow/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;
		Object.assign(this.postOptions, {
			numPosts: 1,
			creatorIndex: 1,
			wantReview: true,
			wantMarkers: 2
		});

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.review = this.postData[0].review;
		this.expectedResponse = {
			review: {
				_id: this.review.id,	// DEPRECATE ME
				id: this.review.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now() // placeholder
				},
				$addToSet: {
					followerIds: this.currentUser.user.id
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}

			}
		};
		this.modifiedAfter = Date.now();
		this.path = `/reviews/follow/${this.review.id}`;
		this.expectedReview = DeepClone(this.review);
		Object.assign(this.expectedReview, this.expectedResponse.review.$set);
		this.expectedReview.followerIds = [this.users[1].user.id, this.currentUser.user.id];
		callback();
	}

	// perform the actual follow
	followReview (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/reviews/follow/${this.review.id}`,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
