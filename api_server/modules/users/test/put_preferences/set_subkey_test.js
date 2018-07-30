'use strict';

var PutPreferencesFetchTest = require('./put_preferences_fetch_test');

class SetSubkeyTest extends PutPreferencesFetchTest {

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
		super.preSetPreferences(callback);
	}

	// make the preferences data to set for the test, and the data we expect
	// to get back when we verify
	makePreferencesData (callback) {
		// establish the preferences we expect to see when we verify, in this
		// case, we're setting a subkey of a preference
		const set = {
			topLevelPreference: {
				preferenceThree: 'three',
				preferenceFour: 4
			}
		};
		this.data = { $set: set };
		this.expectResponse = {
			user: {
				_id: this.currentUser._id,
				$set: {
					'preferences.topLevelPreference.preferenceThree': 'three',
					'preferences.topLevelPreference.preferenceFour': 4
				}
			}
		};
		this.expectPreferences = this.preSetData;
		Object.assign(this.expectPreferences.topLevelPreference, set.topLevelPreference);
		callback();
	}
}

module.exports = SetSubkeyTest;
