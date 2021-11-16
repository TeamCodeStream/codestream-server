'use strict';

const PostPostTest = require('./post_post_test');

class NoMentionForeginUserTest extends PostPostTest {

	get description () {
		return 'should return an error when creating a post with mentions of users who are not on the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			reason: 'one or more mentioned users are not on the team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			this.teamOptions.members = [];
			callback();
		});
	}
	
	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// add users to the mentionedUserIds array, the mentioned user is not on the team
			this.data.mentionedUserIds = [this.users[1].user.id];
			callback();
		});
	}

}

module.exports = NoMentionForeginUserTest;
