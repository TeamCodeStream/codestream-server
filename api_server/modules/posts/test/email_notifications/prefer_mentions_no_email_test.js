'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferMentionsNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications for mentions should not get an email notification for a stream when there is no mention';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			emailNotifications: 'mentions'
		};
	}
}

module.exports = PreferMentionsNoEmailTest;
