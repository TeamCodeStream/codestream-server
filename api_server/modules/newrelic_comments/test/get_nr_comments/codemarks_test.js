'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class CodemarksTest extends GetNRCommentsTest {

	constructor (options) {
		super(options);
		this.numComments = 7;
		this.claimAfter = 2;
		this.commentData = [
			,
			,
			,
			{
				wantCodemark: true
			},
			,
			,
			{
				wantCodemark: true
			}
		];
	}

	get description () {
		return 'should return New Relic comments when requested, including codemarks and code block information';
	}
}

module.exports = CodemarksTest;
