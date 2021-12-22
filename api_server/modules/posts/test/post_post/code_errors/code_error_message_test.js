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

			// allow to create code error without checking New Relic account access
			this.apiRequestOptions = this.apiRequestOptions || {};
			this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
			this.apiRequestOptions.headers['X-CS-NewRelic-Secret'] = this.apiConfig.sharedSecrets.commentEngine;

			callback();
		});
	}
}

module.exports = CodeErrorMessageTest;
