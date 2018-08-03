'use strict';

const OnlyAdminsTest = require('./only_admins_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AdminsCanInviteTest extends OnlyAdminsTest {

	get description () {
		return 'invite should succeed if team is set so that only admins can invite users but the current user is an admin';
	}

	getExpectedError () {
		return null;
	}

	// before the test runs...
	before (callback) {
		// run the usual setup, including setting the setting that only admins can invite,
		// but then make the current user an admin
		BoundAsync.series(this, [
			super.before,
			this.makeCurrentUserAdmin
		], callback);
	}

	// make the current user an admin for the team
	makeCurrentUserAdmin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team._id,
				data: {
					$push: { 
						adminIds: this.currentUser._id 
					}
				},
				token: this.teamCreatorData.accessToken
			},
			callback
		);
	}
}

module.exports = AdminsCanInviteTest;
