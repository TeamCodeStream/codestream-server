'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ChangesetTestConstants = require('../changeset_test_constants');

class GetChangesetsTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.streamOptions, {
			type: this.type || 'channel',
			creatorIndex: 1
		});
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantReview: true,
			wantMarkers: 1,
			numChanges: 5
		});
	}

	get description () {
		return 'should return the correct changesets when requesting changesets for a review';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setChangesets,
			this.setPath
		], callback);
	}

	// set the changesets established for the test
	setChangesets (callback) {
		this.expectedChangesets = [...this.postData[0].reviewChangesets];
		callback();
	}

	// get query parameters to use in the test query
	getQueryParameters () {
		return {
			reviewId: this.postData[0].review.id
		};
	}

	// set the path to use for the request
	setPath (callback) {
		const queryParameters = this.getQueryParameters();
		this.path = '/changesets?' + Object.keys(queryParameters).map(parameter => {
			return `${parameter}=${queryParameters[parameter]}`;
		}).join('&');
		callback();
	}

	// validate correct response
	validateResponse (data) {
		// validate we got the correct changesets, and that they are sanitized (free of attributes we don't want the client to see)
		this.validateMatchingObjects(data.changesets, this.expectedChangesets, 'changesets');
		this.validateSanitizedObjects(data.changesets, ChangesetTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetChangesetsTest;
