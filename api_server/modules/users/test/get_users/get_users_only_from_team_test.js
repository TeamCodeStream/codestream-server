'use strict';

const GetUsersTest = require('./get_users_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const TestTeamCreator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/test_team_creator');

class GetUsersOnlyFromTeamTest extends GetUsersTest {

	constructor (options) {
		super(options);

	}
	get description () {
		return 'should return only the users for the team i\'m a member of';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// run standard setup for test of fetching users
			this.createForeignTeam,	// create another team where the current user will not be a member of the team
			this.setPath			// set the path to use when issuing the test request
		], callback);
	}

	// create a "foreign" team, for which the current user is not a member
	createForeignTeam (callback) {
		new TestTeamCreator({
			test: this,
			teamOptions: Object.assign({}, this.teamOptions, {
				creatorToken: this.users[1].accessToken
			}),
			userOptions: this.userOptions
		}).create((error, data) => {
			if (error) { return callback(error); }
			this.foreignTeam = data.team;
			this.foreignUsers = data.users.filter(user => {
				return user.user.id !== this.users[1].user.id;
			});
			callback();
		});
	}

	// set the path to use when issuing the test request
	setPath (callback) {
		if (!this.foreignTeam) { return callback(); }
		// we'll attempt to fetch some users from "our" team, and users from the "foreign" team, by ID
		// but since we're not allowed to see users on the foreign team, we should only see users on our team
		const teamId = this.team.id;
		this.myUsers = [1,3,4].map(index => this.users[index].user);
		const foreignUsers = [2, 4].map(index => this.foreignUsers[index].user);
		const allUsers = [...this.myUsers, ...foreignUsers];
		const ids = allUsers.map(user => user.id);
		this.path = `/users?teamId=${teamId}&ids=${ids}`;
		callback();
	}
}

module.exports = GetUsersOnlyFromTeamTest;
