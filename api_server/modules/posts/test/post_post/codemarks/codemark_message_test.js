'use strict';

const NewPostMessageToTeamStreamTest = require('../new_post_message_to_team_stream_test');

class CodemarkMessageTest extends NewPostMessageToTeamStreamTest {

	get description () {
		return 'members of the team should receive a message with the post and codemark when a post with a codemark is posted to a team stream';
	}

	makePostData (callback) {
		super.makePostData(error => {
			if (error) { return callback(error); }
			this.data.codemark = this.codemarkFactory.getRandomCodemarkData();
			callback();
		});
	}
}

module.exports = CodemarkMessageTest;
