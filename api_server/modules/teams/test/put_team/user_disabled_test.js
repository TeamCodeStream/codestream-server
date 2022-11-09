'use strict';

const PutTeamTest = require('./put_team_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UserDisabledTest extends PutTeamTest {

	constructor (options) {
		super(options);
		this.otherUserUpdatesTeam = true;
	}

	get description () {
		return 'under one-user-per-org, a user who is removed from a team should no longer be able to login';
	}

	get method () {
		return 'put';
	}

	getExpectedError () {
		return {
			code: 'AUTH-1004'
		};
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
			this.path = '/login';
			callback();
		});
	}
}

module.exports = UserDisabledTest;
