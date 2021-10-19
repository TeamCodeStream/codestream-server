'use strict';

const Assert = require('assert');
const ReviewTestConstants = require('./review_test_constants');
const MarkerValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/test/marker_validator');

class ReviewValidator {

	constructor (options) {
		Object.assign(this, options);
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateReview (data) {
		// verify we got back an review with the attributes we specified
		const review = data.review;
		const expectedOrigin = this.expectedOrigin || '';
		let errors = [];
		let result = (
			((review.id === review._id) || errors.push('id not set to _id')) && 	// DEPRECATE ME
			((review.teamId === this.test.team.id) || errors.push('teamId does not match the team')) &&
			((review.streamId === (this.inputReview.streamId || '')) || errors.push('streamId does not match the stream')) &&
			((review.postId === (this.inputReview.postId || '')) || errors.push('postId does not match the post')) &&
			((review.deactivated === false) || errors.push('deactivated not false')) &&
			((typeof review.createdAt === 'number') || errors.push('createdAt not number')) &&
			((review.lastActivityAt === review.createdAt) || errors.push('lastActivityAt should be set to createdAt')) &&
			((review.modifiedAt >= review.createdAt) || errors.push('modifiedAt not greater than or equal to createdAt')) &&
			((review.creatorId === this.test.currentUser.user.id) || errors.push('creatorId not equal to current user id')) &&
			((review.status === this.inputReview.status) || errors.push('status does not match')) &&
			((review.text === this.inputReview.text) || errors.push('text does not match')) &&
			((review.title === this.inputReview.title) || errors.push('title does not match')) &&
			((review.numReplies === 0) || errors.push('review should have 0 replies')) &&
			((review.origin === expectedOrigin) || errors.push('origin not equal to expected origin'))
		);
		Assert(result === true && errors.length === 0, 'response not valid: ' + errors.join(', '));

		// verify the review in the response has no attributes that should not go to clients
		this.test.validateSanitized(review, ReviewTestConstants.UNSANITIZED_ATTRIBUTES);

		// if we are expecting a marker with the review, validate it
		if (this.test.expectMarkers) {
			new MarkerValidator({
				test: this.test,
				objectName: 'review',
				inputObject: this.inputReview,
				usingCodeStreamChannels: true
			}).validateMarkers(data);
		}
		else {
			Assert(typeof data.markers === 'undefined', 'markers array should not be defined');
		}

		// validate the array of followers
		const expectedFollowerIds = this.test.expectedFollowerIds || [this.test.currentUser.user.id];
		expectedFollowerIds.sort();
		const gotFollowerIds = [...(review.followerIds || [])];
		gotFollowerIds.sort();
		Assert.deepEqual(gotFollowerIds, expectedFollowerIds, 'review does not have correct followerIds');

		// validate the review's permalink
		this.validatePermalink(review.permalink);
	}

	// validate the returned permalink URL is correct
	validatePermalink (permalink) {
		const type = 'r';
		const origin = this.test.apiConfig.apiServer.publicApiUrl.replace(/\//g, '\\/');
		const regex = `^${origin}\\/${type}\\/([A-Za-z0-9_-]+)\\/([A-Za-z0-9_-]+)$`;
		const match = permalink.match(new RegExp(regex));
		Assert(match, `returned permalink "${permalink}" does not match /${regex}/`);

		const teamId = this.decodeLinkId(match[1]);
		Assert.equal(teamId, this.test.team.id, 'permalink does not contain proper team ID');
	}

	decodeLinkId (linkId) {
		linkId = linkId
			.replace(/-/g, '+')
			.replace(/_/g, '/');
		return Buffer.from(linkId, 'base64').toString('hex');
	}
}

module.exports = ReviewValidator;
