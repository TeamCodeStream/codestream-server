'use strict';

var GetMarkersTest = require('./get_markers_test');

class OneRelationalTest extends GetMarkersTest {

	get description () {
		return 'should return an error if more than one relational query parameter is provided for a markers query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'only one relational parameter allowed'
		};
	}

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.lt = 1;
		queryParameters.gt = 2;
		return queryParameters;
	}
}

module.exports = OneRelationalTest;
