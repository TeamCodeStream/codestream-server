'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class GetCheckpointReviewDiffsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
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
		return 'should return a review\'s checkpoint diffs when requested';
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
		this.review = this.postData[0].review;
		this.path = '/reviews/checkpoint-diffs/' + this.review.id;

		// set expected data
		this.expectedData = [];
		const inputReview = this.inputPostData[0].review;
		for (let changeset of inputReview.reviewChangesets || []) {
			this.expectedData.push({
				repoId: changeset.repoId,
				diffs: changeset.diffs
			});
		}

		callback();
	}

	// validate the request response
	validateResponse (data) {
		Assert.deepEqual(data, this.expectedData, 'reviewDiffs not correct');
	}
}

module.exports = GetCheckpointReviewDiffsTest;
