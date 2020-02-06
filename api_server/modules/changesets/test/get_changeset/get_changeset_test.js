'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const ChangesetTestConstants = require('../changeset_test_constants');

class GetChangesetTest extends CodeStreamAPITest {

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
			numChanges: 2
		});
	}

	get description () {
		return 'should return the changeset when requesting a changeset';
	}

	getExpectedFields () {
		return { changeset: ChangesetTestConstants.EXPECTED_CHANGESET_FIELDS };
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
		// try to fetch the changeset
		this.changeset = this.postData[0].reviewChangesets[0];
		this.path = '/changesets/' + this.changeset.id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct marker, and that we only got sanitized attributes
		this.validateMatchingObject(this.changeset.id, data.changeset, 'changeset');
		this.validateSanitized(data.changeset, ChangesetTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = GetChangesetTest;
