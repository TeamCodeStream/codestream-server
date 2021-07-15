'use strict';

const GetCodeErrorsWithMarkersTest = require('./get_code_errors_with_markers_test');

class GetCodeErrorsBeforeInclusiveTest extends GetCodeErrorsWithMarkersTest {

	get description () {
		return 'should return the correct code errors when requesting code errors in a stream before a timestamp, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected code errors based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		const pivot = this.codeErrors[5].createdAt;
		this.expectedCodeErrors = this.codeErrors.filter(codeError => codeError.createdAt <= pivot);
		this.expectedCodeErrors.reverse();
		this.path = `/code-errors?teamId=${this.team.id}&before=${pivot}&inclusive`;
		callback();
	}
}

module.exports = GetCodeErrorsBeforeInclusiveTest;
