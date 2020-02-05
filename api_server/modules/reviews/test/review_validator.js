'use strict';

const Assert = require('assert');
const ReviewTestConstants = require('./review_test_constants');
const MarkerValidator = require(process.env.CS_API_TOP + '/modules/markers/test/marker_validator');
const ArrayUtilities = require(process.env.CS_API_TOP + '/server_utils/array_utilities');

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

		// verify the repo change set is the same as what was passed in
		const expectedRepoIds = ArrayUtilities.unique(
			this.test.data.review.reviewChangesets.map(changeset => changeset.repoId)
		);
		expectedRepoIds.sort();
		const actualRepoIds = [...review.changesetRepoIds];
		actualRepoIds.sort();
		Assert.deepEqual(actualRepoIds, expectedRepoIds, 'review repo IDs not correct according to repos passed in');

		// verify that we got changesets that correspond to the changesets passed in
		const expectedChangesetIds = data.reviewChangesets.map(changeset => changeset.id);
		expectedChangesetIds.sort();
		const actualChangesetIds = review.reviewChangesetIds;
		actualChangesetIds.sort();
		Assert.deepEqual(actualChangesetIds, expectedChangesetIds, 'reviewChangesetIds in review do not match the the reviewChangesets in the response');

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
	}
}

module.exports = ReviewValidator;
