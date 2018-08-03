'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');

class AdminsOkTest extends PutTeamSettingsFetchTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
	}

	get description () {
		return 'admins should be able to update team settings';
	}

	// before the test runs...
	before (callback) {
		// run through normal test setup, but then make the current user an admin
		super.before(error => {
			if (error) { return callback(error); }
			this.makeCurrentUserAdmin(callback);
		});
	}

	// make the current user and admin for the team
	makeCurrentUserAdmin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team._id,
				data: {
					$push: { adminIds: this.currentUser._id }
				},
				token: this.otherUserData.accessToken
			},
			callback
		);
	}
}

module.exports = AdminsOkTest;
