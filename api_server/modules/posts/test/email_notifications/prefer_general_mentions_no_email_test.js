'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferGeneralMentionsNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned to mentions generally should not get an email notification for a stream when there is no mention';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			general: 'mentions'
		};
	}
}

module.exports = PreferGeneralMentionsNoEmailTest;
