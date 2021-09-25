'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class MentionsTest extends CreateNRCommentTest {

	get description () {
		return 'when creating a New Relic comment, handle mentions by creating a faux user as needed';
	}

	// run the base test, but then do more stuff...
	run (callback) {
		// fetch the post created after running the initial test,
		// so we knows the IDs of the users, then fetch those users and confirm they match
		BoundAsync.series(this, [
			super.run,
			this.registerFauxUser,
			this.fetchPost,
			this.fetchUsers
		], callback);
	}

	makeNRCommentData (callback) {
		// add mentions to the test data
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			const emails = [
				this.userFactory.randomEmail(),
				this.userFactory.randomEmail()
			];
			this.data.mentionedUsers = [
				{
					email: emails[0],
					fullName: this.userFactory.randomFullName(),
					username: emails[0].split('@')[0]
				},
				{
					email: emails[1],
					fullName: this.userFactory.randomFullName(),
					username: emails[1].split('@')[0]
				}
			];
			this.expectedResponse.post.mentionedUsers = DeepClone(this.data.mentionedUsers);
			this.expectedResponse.post.mentionedUserIds = ['user1', 'user2']; // placeholders
			this.expectedResponse.post.userMaps.user1 = { ...(this.data.mentionedUsers[0]) };
			this.expectedResponse.post.userMaps.user2 = { ...(this.data.mentionedUsers[1]) };
			callback();
		});
	}


	// validate the response to the test request
	validateResponse (data) {
		// save the fetched post, so we can fetch it by ID
		this.createdPostId = data.post.id;
		this.nrCommentResponse = data;
		super.validateResponse(data);
	}

	// fetch the first comment we created
	fetchPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.createdPostId,
				token: this.token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.fetchedPost = response.post;
				callback();
			}
		);
	}

	// fetch the mentioned users and assert they match
	fetchUsers (callback) {
		const userIds = this.fetchedPost.mentionedUserIds.join(',');
		this.doApiRequest(
			{
				method: 'get',
				path: `/users?ids=${userIds}&teamId=${this.registerUserResponse.user.teamIds[0]}`,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				for (let i = 0; i < 2; i++) {
					const mentionedUserId = this.fetchedPost.mentionedUserIds[i];
					const user = response.users.find(u => u.id === mentionedUserId);
					const mentionedUser = this.nrCommentResponse.post.mentionedUsers.find(u => u.username === user.username); 
					Assert.equal(user.id, mentionedUserId, `fetched user #${i} does not match`);
					Assert.equal(user.email, mentionedUser.email, `email of mentioned user #${i} does not match`);
					if (!user.isRegistered) {
						Assert.equal(user.externalUserId, `newrelic::${mentionedUser.email}`, `externalUserId of mentioned user #{i} does not match`);
					}
				}
				callback();
			}
		)
	}
}

module.exports = MentionsTest;
