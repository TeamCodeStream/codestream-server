'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferOffNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications off should not get an email notification';
	}

	// get the preference to set for the user
	getPreference () {
		return 'off';
	}
}

module.exports = PreferOffNoEmailTest;
