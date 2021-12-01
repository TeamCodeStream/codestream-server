'use strict';

const MentionTest = require('./mention_test');
const Assert = require('assert');

class MentionExistingTest extends MentionTest {

	get description () {
		return 'should return a New Relic comment, with user information for the mention, when an update is made through the comment engine including a mention of an existing user';
 	}

	makeUpdateData (callback) {
		this.mentionedUser = this.users.find(userData => !userData.user.isRegistered);
		this.mentionUser = this.mentionedUser.user;
		super.makeUpdateData(callback);
	}

	validateResponse (data) {
		Assert.strictEqual(data.post.mentionedUserIds[1], this.mentionedUser.user.id, 'mention of existing user ID was not correct');
		super.validateResponse(data);
	}
}

module.exports = MentionExistingTest;
