'use strict';

const UsernameResolutionTest = require('./username_resolution_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');

class ExtendedUsernameResolutionTest extends UsernameResolutionTest {

	constructor (options) {
		super(options);
		this.numConflictingUsers = 5;
	}

	get description () {
		return 'when inviting a new user, and the first part of the user\'s email has a username conflict with several other users on the team, the username conflict should be resolved by appending a numeral to the assigned username of the new user';
	}

	// make the data to use for the test
	makeUserData (callback) {
		// first create several users which will all have emails that conflict with the given
		// user (the "other" user created in the standard test) ... this will cause the test
		// user's username to go through that many cycles of numerals appended to the username
		// before the conflict is resolved
		this.makeOtherUsers(error => {
			if (error) { return callback(error); }
			super.makeUserData(callback);
		});
	}

	// make several other users whose emails will make their default usernames conflict
	makeOtherUsers (callback) {
		BoundAsync.timesSeries(
			this,
			this.numConflictingUsers,
			this.makeOtherUser,
			callback
		);
	}

	// make a single user whose email will make their default username conflict with the
	// existing user on the team, forcing their username to get an appended numeral
	makeOtherUser (n, callback) {
		const conflictingUsername = this.users[1].user.username;
		const domain = `${RandomString.generate(12)}.com`;
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team.id,
					email: `${conflictingUsername}@${domain}`
				},
				token: this.token
			},
			callback
		);
	}
}

module.exports = ExtendedUsernameResolutionTest;
