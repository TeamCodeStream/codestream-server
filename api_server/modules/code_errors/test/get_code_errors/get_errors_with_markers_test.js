'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class GetCodeErrorsWithMarkersTest extends GetCodeErrorsTest {

	constructor (options) {
		super(options);
		this.postOptions.wantMarkers = 3;
	}

	get description () {
		return 'should return the correct code errors with markers when requesting code errors for a team that were created with associated markers';
	}
}

module.exports = GetCodeErrorsWithMarkersTest;
