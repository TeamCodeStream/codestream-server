'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class GetCodeErrorsAfterInclusiveTest extends GetCodeErrorsTest {

	get description () {
		return 'should return the correct error codes when requesting error codes in a stream after a timestamp, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected error codes based on that pivot,
		// and specify the after parameter to fetch based on the pivot
		const pivot = this.codeErrors[5].lastActivityAt;
		this.expectedCodeErrors = this.codeErrors.filter(codeError => codeError.lastActivityAt >= pivot);
		this.expectedCodeErrors.reverse();
		this.path = `/code-errors?teamId=${this.team.id}&after=${pivot}&inclusive`;
		callback();
	}
}

module.exports = GetCodeErrorsAfterInclusiveTest;
