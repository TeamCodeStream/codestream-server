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

	getQueryParameters () {
		let queryParameters = super.getQueryParameters();
		queryParameters.ids = 'x,'.repeat(101).split(',');
		return queryParameters;
	}
}

module.exports = TooManyIDsTest;
