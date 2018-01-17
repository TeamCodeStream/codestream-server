'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferStreamMentionsNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has email notifications turned to mentions only for a stream should not get an email notification when there is no mention';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			[this.stream._id]: 'mentions'
		};
	}
}

module.exports = PreferStreamMentionsNoEmailTest;
