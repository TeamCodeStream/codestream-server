'use strict';

const GetTeamMemberTest = require('./get_team_member_test');

class ACLRemovedTeamMemberTest extends GetTeamMemberTest {

	get description() {
		return 'a user who has been removed from a team should not be able to fetch users who are on that team';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }

			// remove the current user from the team, who should then not be able to fetch the other user
			this.doApiRequest(
				{
					method: 'put',
					path: '/teams/' + this.team.id,
					data: {
						$push: {
							removedMemberIds: this.currentUser.user.id
						}
					},
					token: this.users[2].accessToken
				},
				callback
			);
		});
	}
}

module.exports = ACLRemovedTeamMemberTest;
