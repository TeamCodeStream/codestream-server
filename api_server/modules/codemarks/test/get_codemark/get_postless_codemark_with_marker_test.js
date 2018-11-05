'use strict';

const GetPostlessCodemarkTest = require('./get_postless_codemark_test');
const CodemarkTestConstants = require('../codemark_test_constants');

class GetPostlessCodemarkWithMarkerTest extends GetPostlessCodemarkTest {

	get description () {
		return 'should return the codemark with markers when requesting a postless codemark with markers created for a third-party provider';
	}

	// make the data for the codemark to be created for the test
	makeCodemarkData () {
		const data = super.makeCodemarkData();
		data.markers = this.markerFactory.createRandomMarkers(1, { withRandomStream: true });
		return data;
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

module.exports = GetPostlessCodemarkWithMarkerTest;
