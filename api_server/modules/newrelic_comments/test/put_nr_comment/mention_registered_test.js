'use strict';

const MentionTest = require('./mention_test');
const Assert = require('assert');

class MentionRegisteredTest extends MentionTest {

	get description () {
		return 'should return a New Relic comment, with user information for the mention, when an update is made through the comment engine including a mention of an existing registered user';
 	}

	makeUpdateData (callback) {
		this.mentionedUser = this.currentUser;
		this.mentionUser = this.mentionedUser.user;
		super.makeUpdateData(callback);
	}

	validateResponse (data) {
		Assert.strictEqual(data.post.mentionedUserIds[1], this.currentUser.user.id, 'mention of existing user ID was not correct');
		super.validateResponse(data);
	}
}

module.exports = MentionRegisteredTest;
