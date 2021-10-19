'use strict';

const CodeErrorTest = require('./code_error_test');
const Assert = require('assert');

class IgnoreTeamIdTest extends CodeErrorTest {

	get description () {
		return 'when creating a code error, teamId should be ignored, the code error should not be owned by a team';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			this.data.teamId = this.team.id;
			callback();
		});
	}

	validateResponse (data) {
		Assert.equal(data.codeError.teamId, undefined, 'teamId is not undefined for code error');
		Assert.equal(data.post.teamId, undefined, 'teamId is not undefined for post');
		super.validateResponse(data);
	}
}

module.exports = IgnoreTeamIdTest;
