// base class for many tests of the "POST /users" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.preCreateUser,		// pre-create the user if we want it to exist before the test
			this.createOtherUser,	// create a user who has invited the pre-existing user, as needed
			this.createUserRepo,	// create a repo and team for the pre-created user to be on, if needed
			this.createTeamCreator,	// create another registered user who will be the creator of the team used for the test
			this.createRandomRepo,	// create a random repo (and team) for the test
			this.makeUserData		// make the data to be used during the request
		], callback);
	}

	// pre-create the user if want it to exist before the test
	preCreateUser (callback) {
		if (!this.wantExistingUser) {
			return callback();
		}
		const createFunc = this.existingUserIsRegistered ? 'createRandomUser' : 'registerRandomUser';
		this.userFactory[createFunc]((error, response) => {
			if (error) { return callback(error); }
			this.existingUserData = response;
			callback();
		});
	}

	// create another registered user (in addition to the "current" user)
	createOtherUser (callback) {
		if (!this.existingUserOnTeam && !this.wantOtherUser) {
			return callback();
		}
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo and team for the pre-created user to be on, if needed
	createUserRepo (callback) {
		if (!this.existingUserOnTeam) {
			return callback();
		}
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.existingUserTeam = response.team;
				this.existingUserCompany = response.company;
				callback();
			},
			{
				withEmails: [this.existingUserData.user.email],	// add "pre-existing" user to this team
				token: this.otherUserData.accessToken	// the "other user" is the repo and team creator, unless otherwise specified
			}
		);
	}

	// create a registered user who will be the one that creates the team
	// that the test user will be invited onto
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a repo and team for the test user to be invited onto
	createRandomRepo (callback) {
		const emails = this.dontIncludeCurrentUser ? [] : [this.currentUser.email];
		if (this.existingUserAlreadyOnTeam) {
			emails.push(this.existingUserData.user.email);
		}
		if (this.wantOtherUser) {
			emails.push(this.otherUserData.user.email);
		}
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.company = response.company;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: emails,	// add "current" user to this team, this will be the actual inviter
				token: this.teamCreatorData.accessToken	// the "team creator" creates the repo and team
			}
		);
	}

	// form the data for the user update
	makeUserData (callback) {
		this.data = {
			teamId: this.team._id
		};
		if (this.existingUserData) {
			this.data.email = this.existingUserData.user.email;
		}
		else {
			this.data.email = this.userFactory.randomEmail();
		}
		this.data.fullName = this.userFactory.randomFullName();
		callback();
	}
}

module.exports = CommonInit;
