'use strict';

const GetCodeErrorTest = require('./get_code_error_test');
const MarkerTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/test/marker_test_constants');

class GetCodeErrorWithMarkersTest extends GetCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarkers = 3;
	}

	get description () {
		return 'should return the code error with markers when requesting a code error with markers';
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the markers we expect, and that we only got sanitized attributes
		const codeError = data.codeError;
		this.validateMatchingObjects(codeError.markerIds, data.markers.map(m => m.id), 'markers');
		for (let marker of data.markers) {
			this.validateSanitized(marker, MarkerTestConstants.UNSANITIZED_ATTRIBUTES);
		}
		super.validateResponse(data);
	}
}

module.exports = GetCodeErrorWithMarkersTest;
