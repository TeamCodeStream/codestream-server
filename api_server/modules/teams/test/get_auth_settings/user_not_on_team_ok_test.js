'use strict';

const GetAuthSettingsTest = require('./get_auth_settings_test');

class UserNotOnTeamOkTest extends GetAuthSettingsTest {

	get description() {
		return 'should be ok for a user who is not on the team to fetch the team\'s auth settings';
	}

	// before the test runs...
	before(callback) {
		this.userNotOnTeam = true;
		super.before(callback);
	}
}

module.exports = UserNotOnTeamOkTest;
