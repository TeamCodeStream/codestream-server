'use strict';

var GetMarkerLocationsTest = require('./get_marker_locations_test');

class NoParameterTest extends GetMarkerLocationsTest {

	get description () {
		return `should return and error if getting marker locations without providing ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// get query parameters for the request
	getQueryParameters () {
		// eliminate the given required  parameter from the request
		let queryParameters = super.getQueryParameters();
		delete queryParameters[this.parameter];
		return queryParameters;
	}
}

module.exports = NoParameterTest;
