// base class for many tests of the "PUT /reviews/reopen/:id" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		this.expectedVersion = 3;
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 3;
		this.streamOptions.creatorIndex = 1;
		this.streamOptions.type = this.streamType || 'channel';
		this.streamOptions.isTeamStream = this.isTeamStream || false;

		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.getPostData,		// get random post data for creating the review
			this.createReview,		// create the test review
			this.closeReview,		// close (approve or reject) the review 
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
				wantMarkers: 2,
				streamId: this.stream.id
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

	// close the review, either approving or rejecting as needed
	closeReview (callback) {
		const currentUserHasAcl = this.team.memberIds.includes(this.currentUser.user.id) &&
			(!this.stream || !this.stream.memberIds || this.stream.memberIds.includes(this.currentUser.user.id));
		this.closingUser = currentUserHasAcl ? this.currentUser : this.users[1];
		const which = this.rejectToClose ? 'reject' : 'approve';
		this.doApiRequest(
			{
				method: 'put',
				path: `/reviews/${which}/${this.review.id}`,
				token: this.closingUser.accessToken
			},
			callback
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
					status: 'open'
				},
				$unset: {
					[`approvedBy.${this.currentUser.user.id}`]: true,
					approvedAt: true
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};

		this.modifiedAfter = Date.now();
		this.path = `/reviews/reopen/${this.review.id}`;
		this.expectedReview = DeepClone(this.review);
		this.expectedReview.status = 'open';
		if (!this.rejectToClose) {
			this.expectedReview.approvedBy = {};
		}
		delete this.expectedReview.approvedAt;
		this.expectedReview.version = this.expectedVersion;
		callback();
	}

	// perform the actual reopen
	reopenReview (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/reviews/reopen/${this.review.id}`,
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
