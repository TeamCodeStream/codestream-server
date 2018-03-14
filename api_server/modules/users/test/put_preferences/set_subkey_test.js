'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class SetSubkeyTest extends PutPreferencesTest {

	get description () {
		return 'should set several preference subkeys when requested via $set';
	}

	// pre-set some preferences data before running the test
	preSetPreferences (callback) {
		this.preSetData = {
			topLevelPreference: {
				preferenceOne: 'one',
				preferenceTwo: 2
			}
		};
		this.putPreferences(this.preSetData, callback);
	}

	// make the preferences data to set for the test, and the data we expect
	// to get back when we verify
	makePreferencesData () {
		// establish the preferences we expect to see when we verify, in this
		// case, we're setting a subkey of a preference
		this.expectPreferences = this.preSetData;
		this.expectPreferences.topLevelPreference.preferenceThree = 'three';
		this.expectPreferences.topLevelPreference.preferenceFour = 4;
		// return the actual preferences op that will be performed
		return {
			$set: {
				topLevelPreference: {
					preferenceThree: 'three',
					preferenceFour: 4
				}
			}
		};
	}
}

module.exports = SetSubkeyTest;
