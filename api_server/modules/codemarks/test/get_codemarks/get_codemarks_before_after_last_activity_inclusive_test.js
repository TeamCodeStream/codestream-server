'use strict';

const GetCodemarksByLastActivityTest = require('./get_codemarks_by_last_activity_test');

class GetCodemarksBeforeAfterLastActivityInclusiveTest extends GetCodemarksByLastActivityTest {

	get description () {
		return 'should return the correct codemarks in correct order when requesting codemarks for a team and between last activity timestamps';
	}

	setPath (callback) {
		super.setPath(error => {
			if (error) { return callback(error); }
			// pick bracket points, then filter our expected codemarks based on the brackets,
			// and specify the before and after parameters to fetch based on the brackets
			const beforePivot = this.expectedCodemarks[3].lastActivityAt;
			const afterPivot = this.expectedCodemarks[7].lastActivityAt;
			this.expectedCodemarks = this.expectedCodemarks.filter(codemark => codemark.lastActivityAt <= beforePivot && codemark.lastActivityAt >= afterPivot);
			this.path = `/codemarks?teamId=${this.team.id}&byLastActivityAt=1&before=${beforePivot}&after=${afterPivot}&inclusive`;
			callback();
		});
	}
}

module.exports = GetCodemarksBeforeAfterLastActivityInclusiveTest;
