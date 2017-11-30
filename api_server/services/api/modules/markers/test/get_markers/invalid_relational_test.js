'use strict';

var GetMarkersTest = require('./get_markers_test');

class InvalidRelationalTest extends GetMarkersTest {

	get description () {
		return 'should return an error if an invalid relational value is provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'must be a number'
		};
	}

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.lt = 'x';
		return queryParameters;
	}
}

module.exports = InvalidRelationalTest;
