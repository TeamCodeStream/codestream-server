'use strict';

const CodemarkMarkerTest = require('./codemark_marker_test');
const Assert = require('assert');

class NewUsersOnTheFlyTest extends CodemarkMarkerTest {

	constructor (options) {
		super(options);
		this.streamOptions.isTeamStream = true;
	}

	get description () {
		return 'should create new users who are invited to the team when creating a post and codemark with added users';
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
		newEmails.sort();

		// except ... users who were already on the team
		const addedUsers = this.data.addedUsers.filter(email => {
			return !this.users.find(userData => {
				return userData.user.email === email && userData.user.teamIds.includes(this.team.id);
			});
		});
		addedUsers.sort();

		Assert.deepStrictEqual(newEmails, addedUsers, 'returned users did not match the new users sent in the request');

		// all the returned users should have been added to the team
		data.users.forEach((user, i) => {
			Assert(user.teamIds.includes(this.team.id), 'new user was not added to team');
			if (!user.isRegistered) {
				const firstInviteType = this.noFirstInviteType && this.noFirstInviteType[i] ? undefined : 'codemarkNotification';
				Assert.strictEqual(user.lastInviteType, 'codemarkNotification', 'lastInviteType should be set to codemarkNotification');
				Assert.strictEqual(user.firstInviteType, firstInviteType, 'firstInviteType should be set to ' + (firstInviteType || 'undefined'));
				Assert.strictEqual(user.inviteTrigger, `C${data.codemark.id}`, 'inviteTrigger should be set to "C" plus the codemark id');
			}
		});

		// all the added users (including ones who were already on the team) should have been added
		// as followers of the codemark
		const addedUserIds = this.data.addedUsers.map(email => {
			const foundUser = (
				data.users.find(user => user.email === email) ||
				this.users.map(userData => userData.user).find(user => user.email === email)
			);
			return foundUser.id;
		});
		this.expectedFollowerIds = (this.expectedFollowerIds || [this.currentUser.user.id]).concat(addedUserIds);

		super.validateResponse(data);
	}
}

module.exports = NewUsersOnTheFlyTest;
