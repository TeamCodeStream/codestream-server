'use strict';

const CodeErrorReplyTest = require('./code_error_reply_test');
const Assert = require('assert');

class IgnoreTeamIdInReplyTest extends CodeErrorReplyTest {

	get description () {
		return 'when replying to a code error, teamId should be ignored, the post should not be owned by a team (unless it has a codemark)';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.data.teamId = this.team.id;
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.post.teamId, undefined, 'teamId is not undefined for post');
		super.validateResponse(data);
	}
}

module.exports = IgnoreTeamIdInReplyTest;
