'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferDefaultMentionsNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned to mentions by default should not get an email notification for a stream when there is no mention';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			default: 'mentions'
		};
	}
}

module.exports = PreferDefaultMentionsNoEmailTest;
