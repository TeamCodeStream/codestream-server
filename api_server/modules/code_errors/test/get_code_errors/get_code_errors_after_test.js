'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class GetCodeErrorsAfterTest extends GetCodeErrorsTest {

	get description () {
		return 'should return the correct code errors when requesting code errors in a stream after a timestamp';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected code errors based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		const pivot = this.codeErrors[5].lastActivityAt;
		this.expectedCodeErrors = this.codeErrors.filter(codeError => codeError.lastActivityAt > pivot);
		this.expectedCodeErrors.reverse();
		this.path = `/code-errors?teamId=${this.team.id}&after=${pivot}`;
		callback();
	}
}

module.exports = GetCodeErrorsAfterTest;
