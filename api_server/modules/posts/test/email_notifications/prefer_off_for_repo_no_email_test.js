'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferOffForRepoNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has a whole repo muted should not get an email notification for any files in the repo';
	}

	// get the preference to set for the user
	getPreference () {
		return {
			streamTreatments: {
				[this.repo.id]: {
					['/']: 'mute'
				}
			}
		};
	}
}

module.exports = PreferOffForRepoNoEmailTest;
