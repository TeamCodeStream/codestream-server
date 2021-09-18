'use strict';

const GetCodeErrorsTest = require('./get_code_errors_test');

class GetCodeErrorsBeforeAfterInclusiveTest extends GetCodeErrorsTest {

	get description () {
		return 'should return the correct code errors when requesting code errors in a stream between timestamps, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick bracket points, then filter our expected code errors based on the brackets,
		// and specify the before and after parameters to fetch based on the brackets
		const beforePivot = this.codeErrors[7].createdAt;
		const afterPivot = this.codeErrors[3].createdAt;
		this.expectedCodeErrors = this.codeErrors.filter(codeError => codeError.createdAt <= beforePivot && codeError.createdAt >= afterPivot);
		this.expectedCodeErrors.reverse();
		this.path = `/code-errors?teamId=${this.team.id}&before=${beforePivot}&after=${afterPivot}&inclusive`;
		callback();
	}
}

module.exports = GetCodeErrorsBeforeAfterInclusiveTest;
