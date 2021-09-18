'use strict';

const GetCodeErrorsByLastActivityTest = require('./get_code_errors_by_last_activity_test');

class GetCodeErrorsAfterLastActivityInclusiveTest extends GetCodeErrorsByLastActivityTest {

	get description () {
		return 'should return the correct code errors in correct order when requesting code errors for a team and after last activity, inclusive';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			// pick a pivot point, then filter our expected code errors based on that pivot,
			// and specify the before parameter to fetch based on the pivot
			const pivot = this.expectedCodeErrors[5].lastActivityAt;
			this.expectedCodeErrors = this.expectedCodeErrors.filter(codeError => codeError.lastActivityAt >= pivot);
			this.path = `/code-errors?teamId=${this.team.id}&byLastActivityAt=1&after=${pivot}&inclusive`;
			callback();
		});
	}
}

module.exports = GetCodeErrorsAfterLastActivityInclusiveTest;
