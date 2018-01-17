'use strict';

var PreferenceOffTest = require('./preference_off_test');
var Path = require('path');

class PreferOffForDirectoryNoEmailTest extends PreferenceOffTest {

	get description () {
		return 'a user who has a directory muted should not get an email notification for the stream for any files in the directory';
	}

	// get the preference to set for the user
	getPreference () {
		let directory = Path.dirname(this.stream.file).replace(/\./g, '*');
		return {
			streamTreatments: {
				[this.repo._id]: {
					[directory]: 'mute'
				}
			}
		};
	}
}

module.exports = PreferOffForDirectoryNoEmailTest;
