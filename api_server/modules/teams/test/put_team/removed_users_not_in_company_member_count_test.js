'use strict';

const RemoveUsersTest = require('./remove_users_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RemovedUsersNotInCompanyMemberCountTest extends RemoveUsersTest {

	get description () {
		return 'count of members in a company should not include users who have been removed from the teams in that company';
	}

	run (callback) {
		// run the usual test, then fetch the team and verify the member count is correct
		BoundAsync.series(this, [
			super.run,
			this.fetchTeam
		], callback);
	}

	fetchTeam (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/teams/' + this.team.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.team.companyMemberCount, 1, 'count of members should be 1 after removing other members');
				callback();
			}
		);
	}
}

module.exports = RemovedUsersNotInCompanyMemberCountTest;
