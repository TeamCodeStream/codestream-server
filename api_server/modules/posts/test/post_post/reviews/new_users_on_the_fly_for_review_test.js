'use strict';

const ReviewersTest = require('./reviewers_test');
const Assert = require('assert');

class NewUsersOnTheFlyForReviewTest extends ReviewersTest {

	constructor (options) {
		super(options);
		this.streamOptions.isTeamStream = true;
	}

	get description () {
		return 'should create new users who are invited to the team when creating a post and review with added users';
	}
	
	// form the data we'll use in creating the post
	makePostData (callback) {
		super.makePostData(() => {
			this.data.addedUsers = [
				this.userFactory.randomEmail(),
				this.userFactory.randomEmail()
			];
			callback();
		});
	}

	validateResponse (data) {
		// expect the new users to be in the returned response
		const newEmails = (data.users || []).map(u => u.email);
		const newUserIds = (data.users || []).map(u => u.id);
		newEmails.sort();
		newUserIds.sort();

		// except ... users who were already on the team
		const addedUsers = this.data.addedUsers.filter(email => {
			return !this.users.find(userData => {
				return userData.user.email === email && userData.user.teamIds.includes(this.team.id);
			});
		});
		addedUsers.sort();

		Assert.deepEqual(newEmails, addedUsers, 'returned users did not match the new users sent in the request');

		// all the returned users should have been added to the team
		data.users.forEach(user => {
			Assert(user.teamIds.includes(this.team.id), 'new user was not added to team');
			if (!user.isRegistered) {
				Assert.strictEqual(user.lastInviteType, 'reviewNotification', 'lastInviteType should be set to reviewNotification');
				Assert.strictEqual(user.firstInviteType, 'reviewNotification', 'firstInviteType should be set to reviewNotification');
				Assert.strictEqual(user.inviteTrigger, `R${data.review.id}`, 'inviteTrigger should be set to "R" plus the review id');
			}
		});

		// all the added users (including ones who were already on the team) should have been added
		// as reviewers 
		const addedUserIds = this.data.addedUsers.map(email => {
			const foundUser = (
				data.users.find(user => user.email === email) ||
				this.users.map(userData => userData.user).find(user => user.email === email)
			);
			return foundUser.id;
		});
		this.expectedFollowerIds = (this.expectedFollowerIds || [this.currentUser.user.id]).concat(addedUserIds);

		const expectedReviewers = [...(this.data.review.reviewers || []), ...newUserIds];
		expectedReviewers.sort();
		data.review.reviewers.sort();
		Assert.deepEqual(data.review.reviewers, expectedReviewers, 'new users were not set to be reviewers');
		super.validateResponse(data);
	}
}

module.exports = NewUsersOnTheFlyForReviewTest;
