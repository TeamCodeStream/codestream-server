'use strict';

const GetCodeErrorsWithMarkersTest = require('./get_error_codes_with_markers_test');

class GetCodeErrorsAfterInclusiveTest extends GetCodeErrorsWithMarkersTest {

	get description () {
		return 'should return the correct error codes when requesting error codes in a stream after a timestamp, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected error codes based on that pivot,
		// and specify the after parameter to fetch based on the pivot
		const pivot = this.codeErrors[5].createdAt;
		this.expectedCodeErrors = this.CodeErrors.filter(codeError => codeError.createdAt >= pivot);
		this.expectedCodeErrors.reverse();
		this.path = `/error-codes?teamId=${this.team.id}&after=${pivot}&inclusive`;
		callback();
	}
}

module.exports = GetCodeErrorsAfterInclusiveTest;
