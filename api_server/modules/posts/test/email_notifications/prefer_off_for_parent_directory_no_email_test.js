'use strict';

var PreferenceOffTest = require('./preference_off_test');
var Path = require('path');

class PreferOffForParentDirectoryNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has a parent directory muted should not get an email notification for any files in the repo';
	}

	// get the preference to set for the user
	getPreference () {
		let directory = Path.dirname(Path.dirname(this.stream.file)).replace(/\./g, '*');
		return {
			streamTreatments: {
				[this.repo.id]: {
					[directory]: 'mute'
				}
			}
		};
	}
}

module.exports = PreferOffForParentDirectoryNoEmailTest;
