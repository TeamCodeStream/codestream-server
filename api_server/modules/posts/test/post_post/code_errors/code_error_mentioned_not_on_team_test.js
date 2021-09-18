'use strict';

const CodeErrorFollowersMentionedTest = require('./code_error_followers_mentioned_test');

class CodeErrorMentionedNotOnTeamTest extends CodeErrorFollowersMentionedTest {

	get description () {
		return 'should return an error if a user from a different team is mentioned for a code error created with a post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'followers must contain only users on the team'
		};
	}

	setTestOptions( callback) {
		super.setTestOptions(() => {
			// create an additional user that won't be on the team, then include them as a follower
			this.userOptions.numRegistered = 6;
			this.teamOptions.members = [0, 1, 2, 3, 4];
			callback();
		});
	}

	makePostData (callback) {
		super.makePostData(() => {
			// include a user not on the team as a follower
			this.data.mentionedUserIds.push(this.users[5].user.id);
			callback();
		});
	}
}

module.exports = CodeErrorMentionedNotOnTeamTest;
