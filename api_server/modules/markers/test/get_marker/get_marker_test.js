'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const MarkerTestConstants = require('../marker_test_constants');

class GetMarkerTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		this.streamOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantCodemark: true,
			wantMarker: true
		});
	}

	get description () {
		return 'should return the marker when requesting a marker';
	}

	getExpectedFields () {
		return { marker: MarkerTestConstants.EXPECTED_MARKER_FIELDS };
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
		// try to fetch the marker
		this.marker = this.postData[0].markers[0];
		this.path = '/markers/' + this.marker._id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct marker, and that we only got sanitized attributes
		this.validateMatchingObject(this.marker._id, data.marker, 'marker');
		this.validateSanitized(data.marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent codemark, with only sanitized attributes
		this.validateMatchingObject(this.postData[0].codemark._id, data.codemark, 'codemark');
		this.validateSanitized(data.codemark, MarkerTestConstants.UNSANITIZED_CODEMARK_ATTRIBUTES);

		// if using CodeStream posts, validate that we got the referencing post, with only sanitized attributes
		this.validateMatchingObject(this.postData[0].post._id, data.post, 'post');
		this.validateSanitized(data.post, MarkerTestConstants.UNSANITIZED_POST_ATTRIBUTES);
	}
}

module.exports = GetMarkerTest;
