// base class for many tests of the "PUT /reviews/approve/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 3;
		/*
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;
		*/
		this.repoOptions.creatorIndex = 1;

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.getPostData,		// get random post data for creating the review
			this.createReview,		// create the test review
			this.makeTestData		// make the data to use when issuing the test request
		], callback);
	}

	// get the random post data for creating the review
	getPostData (callback) {
		this.postFactory.getRandomPostData(
			(error, data) => {
				if (error) { return callback(error); }
				this.postData = data;
				callback();
			},
			{
				wantReview: true,
				numChanges: 2,
				changesetRepoId: this.repo.id,
				wantMarkers: 2,
				streamId: this.teamStream.id
			}
		);

	}

	// create the test review
	createReview (callback) {
		this.postData.review.reviewers = [ this.users[0].user.id, this.users[2].user.id ]
			.filter(id => this.team.memberIds.includes(id));
		if (this.allReviewersMustApprove) {
			this.postData.review.allReviewersMustApprove = true;
		}
		this.doApiRequest(
			{
				method: 'post',
				path: '/posts',
				data: this.postData,
				token: this.users[1].accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.review = response.review;
				callback();
			}
		);
	}

	// make the data to use when issuing the test request
	makeTestData (callback) {
		this.expectedResponse = {
			review: {
				_id: this.review.id,	// DEPRECATE ME
				id: this.review.id,
				$set: {
					version: this.expectedVersion,
					modifiedAt: Date.now(), // placeholder
					[`approvedBy.${this.currentUser.user.id}`]: {
						approvedAt: Date.now() // placeholder
					}
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		if (!this.allReviewersMustApprove || this.expectApproval) {
			this.expectedResponse.review.$set.status = 'approved';
			this.expectedResponse.review.$set.approvedAt = Date.now(); // placeholder
		}

		this.modifiedAfter = Date.now();
		this.path = `/reviews/approve/${this.review.id}`;
		this.expectedReview = DeepClone(this.review);
		this.expectedReview.status = 'approved';
		this.expectedReview.version = this.expectedVersion;
		this.expectedReview.approvedBy = {
			[this.currentUser.user.id]: {
				approvedAt: Date.now() // placeholder
			}
		};
		this.expectedReview.approvedAt = Date.now(); // placeholder
		callback();
	}

	// perform the actual approval
	approveReview (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/reviews/approve/${this.review.id}`,
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
