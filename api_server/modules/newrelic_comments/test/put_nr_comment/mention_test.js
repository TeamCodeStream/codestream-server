'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');
const Assert = require('assert');

class MentionTest extends UpdateNRCommentTest {

	get description () {
		return 'should return a New Relic comment, with user information for the mention, when an update is made through the comment engine including a mention';
 	}

	makeUpdateData (callback) {
		super.makeUpdateData(error => {
			if (error) { return callback(error); }
			const email1 = this.userFactory.randomEmail();
			const email2 = (this.mentionUser && this.mentionUser.email) || this.userFactory.randomEmail();
			this.mentionedEmails = [ email1, email2 ];
			this.data.mentionedUsers = [
				{
					email: this.mentionedEmails[0]
				},
				{
					email: this.mentionedEmails[1]
				}
			];
			this.expectedResponse.post.mentionedUsers = [
				{
					email: this.mentionedEmails[0],
					fullName: '',
					username: this.mentionedEmails[0].split('@')[0]
				},
				{
					email: this.mentionedEmails[1],
					fullName: (this.mentionUser && this.mentionUser.fullName) || '',
					username: (this.mentionUser && this.mentionUser.username) || this.mentionedEmails[1].split('@')[0]
				}
			];
			callback();
		});
	}

	validateResponse (data) {
		const responseEmails = data.post.mentionedUsers.map(u => u.email);
		Assert.deepStrictEqual(responseEmails, this.mentionedEmails, 'mentioned users is not correct');
		Assert.equal(data.post.mentionedUserIds.length, this.mentionedEmails.length, 'mentionedUserIds is not the proper length');
		for (let i = 0; i < this.mentionedEmails.length; i++) {
			const userId = data.post.mentionedUserIds[i];
			this.expectedResponse.post.userMaps[userId] = {
				...this.expectedResponse.post.mentionedUsers[i]
			};
			this.expectedResponse.post.mentionedUserIds.push(userId);
		}
		super.validateResponse(data);
	}
}

module.exports = MentionTest;
