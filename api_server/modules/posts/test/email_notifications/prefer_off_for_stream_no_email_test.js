'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferOffForStreamNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned off for a specific stream should not get an email notification for that stream';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			[this.stream._id]: 'off'
		};
	}
}

module.exports = PreferOffForStreamNoEmailTest;
