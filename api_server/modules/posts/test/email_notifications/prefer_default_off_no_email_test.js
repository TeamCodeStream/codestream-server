'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferDefaultOffNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned off by default should not get an email notification for a stream that is not turned on';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			default: 'off'
		};
	}
}

module.exports = PreferDefaultOffNoEmailTest;
