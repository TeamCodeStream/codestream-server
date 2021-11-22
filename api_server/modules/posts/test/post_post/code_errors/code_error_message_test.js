'use strict';

const NewPostMessageToTeamStreamTest = require('../new_post_message_to_team_stream_test');

class CodeErrorMessageTest extends NewPostMessageToTeamStreamTest {

	get description () {
		return 'members of the team should receive a message with the post and code error when a post with a code error is posted to a team stream';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.codeError = this.codeErrorFactory.getRandomCodeErrorData();
			callback();
		});
	}
}

module.exports = CodeErrorMessageTest;
