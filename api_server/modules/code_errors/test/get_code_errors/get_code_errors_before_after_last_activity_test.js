'use strict';

const GetCodeErrorsByLastActivityTest = require('./get_code_errors_by_last_activity_test');

class GetCodeErrorsBeforeAfterLastActivityTest extends GetCodeErrorsByLastActivityTest {

	get description () {
		return 'should return the correct code errors in correct order when requesting code errors for a team and between last activity timestamps';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			// pick bracket points, then filter our expected code errors based on the brackets,
			// and specify the before and after parameters to fetch based on the brackets
			const beforePivot = this.expectedCodeErrors[3].lastActivityAt;
			const afterPivot = this.expectedCodeErrors[7].lastActivityAt;
			this.expectedCodeErrors = this.expectedCodeErrors.filter(codeError => codeError.lastActivityAt < beforePivot && codeError.lastActivityAt > afterPivot);
			this.path = `/code-errors?teamId=${this.team.id}&byLastActivityAt=1&before=${beforePivot}&after=${afterPivot}`;
			callback();
		});
	}
}

module.exports = GetCodeErrorsBeforeAfterLastActivityTest;
