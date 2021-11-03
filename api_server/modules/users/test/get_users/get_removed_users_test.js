'use strict';

const GetUsersByTeamIdTest = require('./get_users_by_team_id_test');
const Assert = require('assert');

class GetRemovedUsersTest extends GetUsersByTeamIdTest {

	get description () {
		return 'should return users who were once on the team but then were removed';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.removeUser(callback);
		});
	}

	// remove one of the users from the team
	removeUser (callback) {
		this.removedUser = this.users[2].user;
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: {
					$push: {
						removedMemberIds: this.removedUser.id
					}
				},
				token: this.token
			},
			callback
		);
	}

	validateResponse (data) {
		const removedUser = data.users.find(user => user.id === this.removedUser.id);
		Assert(removedUser, 'removed user not found among the users returned');
		Assert(!removedUser.teamIds.includes(this.team.id), 'removed user was not actually removed from the team');
		Assert(!removedUser.companyIds.includes(this.company.id), 'removed user was not actually removed from the company');
		super.validateResponse(data);
	}
}

module.exports = GetRemovedUsersTest;
