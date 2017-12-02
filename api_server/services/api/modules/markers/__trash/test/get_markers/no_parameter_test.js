'use strict';

var GetMarkersTest = require('./get_markers_test');

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

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		delete queryParameters[this.parameter];
		return queryParameters;
	}
}

module.exports = NoParameterTest;
