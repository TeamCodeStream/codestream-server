'use strict';

const GetTeamMemberTest = require('./get_team_member_test');

class GetRemovedTeamMemberTest extends GetTeamMemberTest {

	get description() {
		return 'should return user when requesting someone else who was on one of my teams but was then removed';
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }

			// remove the other user from the team, should still be able to fetch
			this.doApiRequest(
				{
					method: 'put',
					path: '/teams/' + this.team.id,
					data: {
						$push: {
							removedMemberIds: this.otherUser.id
						}
					},
					token: this.users[2].accessToken
				},
				callback
			);
		});
	}
}

module.exports = GetRemovedTeamMemberTest;
