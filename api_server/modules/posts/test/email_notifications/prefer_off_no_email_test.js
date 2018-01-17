'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferOffNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned off should not get an email notification';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			emailNotifications: 'off'
		};
	}
}

module.exports = PreferOffNoEmailTest;
