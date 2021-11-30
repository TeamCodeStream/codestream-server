'use strict';

const GetNRCommentsTest = require('./get_nr_comments_test');

class CodemarksAndRepliesTest extends GetNRCommentsTest {

	constructor (options) {
		super(options);
		this.numComments = 13;
		this.claimAfter = 2;
		this.commentData = [
			{ },	// 0
			{ 		// 1
				author: 1
			},
			{		// 2
				replyTo: 1
			},
			{		// 3
				wantCodemark: true
			},
			{		// 4
				replyFromCSTo: 1,
			},
			{		// 5
				replyTo: 3
			},
			{		// 6
				replyTo: 1,
				author: 3
			},
			{		// 7
				wantCodemark: true,
				author: 2
			},
			{		// 8
				replyFromCSTo: 7,
				author: 2
			},
			{		// 9
				author: 3
			},
			{		// 10
				replyFromCSTo: 3,
				author: 0
			},
			{		// 11
				replyTo: 3,
				author: 5
			}
		]
		this.userOptions.numRegistered = 3;
		this.userOptions.numUnregistered = 2;
	}

	get description () {
		return 'should return New Relic comments when requested, including replies as well as codemarks and code block information';
	}
}

module.exports = CodemarksAndRepliesTest;
