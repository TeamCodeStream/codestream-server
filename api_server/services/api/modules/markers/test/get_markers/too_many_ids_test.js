'use strict';

var GetMarkersTest = require('./get_markers_test');

class TooManyIDsTest extends GetMarkersTest {

	get description () {
		return 'should return an error when trying to fetch markers and specifying too many IDs';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'too many IDs'
		};
	}

	// get query parameters to use for the test
	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		// try to fetch more than 100 IDs (whether valid or not)... can't do it!
		queryParameters.ids = 'x,'.repeat(101).split(',');
		return queryParameters;
	}
}

module.exports = TooManyIDsTest;
