'use strict';

const GetAuthSettingsTest = require('./get_auth_settings_test');

class NoTokenOkTest extends GetAuthSettingsTest {

	get description() {
		return 'should be ok to fetch auth settings for a team without an access token';
	}

	// before the test runs...
	before(callback) {
		this.ignoreTokenOnRequest = true;
		super.before(callback);
	}
}

module.exports = NoTokenOkTest;
