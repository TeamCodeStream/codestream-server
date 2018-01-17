'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferMentionsNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned to mentions only should not get an email notification when there is no mention';
	}

	// get the preference to set for the user
	getPreference () {
		return 'mentions';
	}
}

module.exports = PreferMentionsNoEmailTest;
