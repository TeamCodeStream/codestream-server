'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class UserDeactivatedTest extends PutTeamTest {

	constructor (options) {
		super(options);
		this.otherUserUpdatesTeam = true;
	}

	get description () {
		return 'under one-user-per-org, the user record for a user removed from a team should be deactivated';
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
			this.data.$addToSet = {
				removedMemberIds: this.currentUser.user.id
			};
			this.path = '/users/' + this.currentUser.user.id;
			this.token = this.users[1].accessToken;
			callback();
		});
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert.strictEqual(data.user.deactivated, true, 'user was not deactivated');
		Assert(data.user.email.match(/.*-deactivated[0-9]*@/, 'user does not have a deactivated email'));
	}
}

module.exports = UserDeactivatedTest;
