'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferGeneralOffNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned off generally should not get an email notification for a stream that is not turned on';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			general: 'off'
		};
	}
}

module.exports = PreferGeneralOffNoEmailTest;
