'use strict';

var PreferenceOffTest = require('./preference_off_test');

class PreferOffForFileNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has a file muted should not get an email notification for the stream for that file';
	}

	// get the preference to set for the user
	getPreference () {
		let file = this.stream.file.replace(/\./g, '*');
		return {
			streamTreatments: {
				[this.repo.id]: {
					[file]: 'mute'
				}
			}
		};
	}
}

module.exports = PreferOffForFileNoEmailTest;
