'use strict';

const GetCodemarksTest = require('./get_codemarks_test');

class GetCodemarksBeforeAfterInclusiveTest extends GetCodemarksTest {

	get description () {
		return 'should return the correct codemarks when requesting codemarks in a stream between timestamps, inclusive';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick bracket points, then filter our expected codemarks based on the brackets,
		// and specify the before and after parameters to fetch based on the brackets
		const beforePivot = this.codemarks[7].createdAt;
		const afterPivot = this.codemarks[3].createdAt;
		this.expectedCodemarks = this.codemarks.filter(codemark => codemark.createdAt <= beforePivot && codemark.createdAt >= afterPivot);
		this.expectedCodemarks.reverse();
		this.path = `/codemarks?teamId=${this.team.id}&before=${beforePivot}&after=${afterPivot}&inclusive`;
		callback();
	}
}

module.exports = GetCodemarksBeforeAfterInclusiveTest;
