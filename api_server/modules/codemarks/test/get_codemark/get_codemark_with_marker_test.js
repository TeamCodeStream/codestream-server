'use strict';

const GetCodemarkTest = require('./get_codemark_test');
const CodemarkTestConstants = require('../codemark_test_constants');

class GetCodemarkWithMarkerTest extends GetCodemarkTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarker = true;
	}

	get description () {
		return 'should return the codemark with markers when requesting an codemark with markers';
	}

	// validate the request response
	validateResponse (data) {
		// validate we got a marker, and that we only got sanitized attributes
		const codemark = data.codemark;
		const marker = data.markers[0];
		this.validateMatchingObject(codemark.markerIds[0], marker, 'marker');
		this.validateSanitized(marker, CodemarkTestConstants.UNSANITIZED_MARKER_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = GetCodemarkWithMarkerTest;
