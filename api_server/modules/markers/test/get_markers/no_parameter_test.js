'use strict';

const GetMarkersTest = require('./get_markers_test');

class NoParameterTest extends GetMarkersTest {

	get description () {
		return `should return and error if getting markers without providing ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// get query parameters to use for the test
	getQueryParameters () {
		const queryParameters = super.getQueryParameters();
		// eliminate the parameter in question for this test
		delete queryParameters[this.parameter];
		return queryParameters;
	}
}

module.exports = NoParameterTest;
