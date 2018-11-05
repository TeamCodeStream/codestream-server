'use strict';

const GetCodeMarksTest = require('./get_codemarks_test');

class GetCodeMarksAfterTest extends GetCodeMarksTest {

	get description () {
		return 'should return the correct codemarks when requesting codemarks in a stream after a timestamp';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected codemarks based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		const pivot = this.codemarks[5].createdAt;
		this.expectedCodeMarks = this.codemarks.filter(codemark => codemark.createdAt > pivot);
		this.path = `/codemarks?teamId=${this.team._id}&after=${pivot}`;
		callback();
	}
}

module.exports = GetCodeMarksAfterTest;
