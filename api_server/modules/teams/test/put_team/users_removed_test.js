'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class UsersRemovedTest extends PutTeamTest {

	constructor (options) {
		super(options);
		this.otherUserUpdatesTeam = true;
	}

	get description () {
		return 'users removed from a team should have the team removed from their teamIds';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.updateTeam	// perform the actual update
		], callback);
	}

	// form the data for the team update
	makeTeamData (callback) {
		// remove the current user from the team, this will be done by the "other" user
		super.makeTeamData(() => {
			this.data.$pull = {
				memberIds: this.currentUser.user.id
			};
			this.path = '/users/me';
			callback();
		});
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify the team we were removed from is not in the current user's teamIds
		Assert(!data.user.teamIds.includes(this.team.id));
	}
}

module.exports = UsersRemovedTest;
