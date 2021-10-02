'use strict';

const CodeErrorReplyWithCodemarkTest = require('./code_error_reply_with_codemark_test');

class CodeErrorReplyTeamIdRequiredTest extends CodeErrorReplyWithCodemarkTest {

	get description () {
		return `should return an error when attempting to create a codemark reply to a code error with no teamId`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the streamId attribute
		super.makePostData(() => {
			delete this.data.teamId;
			callback();
		});
	}
}

module.exports = CodeErrorReplyTeamIdRequiredTest;
