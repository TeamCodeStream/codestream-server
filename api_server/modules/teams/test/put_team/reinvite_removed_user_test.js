'use strict';

const RemoveUserTest = require('./remove_user_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ReinviteRemovedUserTest extends RemoveUserTest {

	get description () {
		return 'should be ok to reinvite a user that has been removed from a team';
	}

	run (callback) {
		BoundAsync.series(this, [
			super.run,	// do the usual test
			this.reinviteUser,
			this.checkTeam,
			this.checkUser
		], callback);
	}

	reinviteUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					email: this.removedUsers[0].email,
					teamId: this.team.id
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.reinviteUserResponse = response;
				callback();
			}
		);
	}

	checkTeam (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/teams/' + this.team.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.team.memberIds.includes(this.removedUsers[0].id));
				// in one-user-per-org, a new user record is created for the invite
				Assert((response.team.removedMemberIds || []).includes(this.removedUsers[0].id));
				Assert((response.team.memberIds || []).includes(this.reinviteUserResponse.user.id));
				callback();
			}
		);
	}

	checkUser (callback) {
		const userId = this.reinviteUserResponse.user.id;
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/' + userId,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.user.teamIds.includes(this.team.id));
				callback();
			}
		);
	}
}

module.exports = ReinviteRemovedUserTest;
