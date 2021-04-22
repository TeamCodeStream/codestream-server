'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class GetReviewDiffsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		this.repoOptions.numRepos = 2;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantReview: true,
			wantMarkers: 1,
			numChanges: 2
		});
	}

	get description () {
		return 'should return a review\'s diffs when requested';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for the request
		], callback);
	}

	// set the path to use for the request
	setPath (callback) {
		// try to fetch the review
		this.review = this.postData[0].review;
		this.path = '/reviews/diffs/' + this.review.id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		const expectedData = {};
		const inputReview = this.inputPostData[0].review;
		for (let changeset of inputReview.reviewChangesets || []) {
			expectedData[changeset.repoId] = changeset.diffs;
		}
		Assert.deepEqual(data, expectedData, 'reviewDiffs not correct');
	}
}

module.exports = GetReviewDiffsTest;
