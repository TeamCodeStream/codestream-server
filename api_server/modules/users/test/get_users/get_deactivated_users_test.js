'use strict';

const GetUsersByTeamIdTest = require('./get_users_by_team_id_test');
const Assert = require('assert');

class GetDeactivatedUsersTest extends GetUsersByTeamIdTest {

	get description () {
		return 'should return users who were once on the team but then were deactivated';
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.deactivateUser(callback);
		});
	}

	// deactivate one of the users
	deactivateUser (callback) {
		this.deactivatedUser = this.users[2].user;
		this.doApiRequest(
			{
				method: 'delete',
				path: '/users/' + this.deactivatedUser.id,
				token: this.token,
				headers: {
					'x-delete-user-secret': this.apiConfig.sharedSecrets.confirmationCheat
				}
			},
			callback
		);
	}

	validateResponse (data) {
		const deactivatedUser = data.users.find(user => user.id === this.deactivatedUser.id);
		Assert(deactivatedUser, 'deactivated user not found among the users returned');
		Assert(deactivatedUser.deactivated, 'deactivated user was not actually deactivated');
		super.validateResponse(data);
	}
}

module.exports = GetDeactivatedUsersTest;
