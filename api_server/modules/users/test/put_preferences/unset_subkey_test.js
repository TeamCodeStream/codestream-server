'use strict';

var PutPreferencesFetchTest = require('./put_preferences_fetch_test');

class UnsetSubkeyTest extends PutPreferencesFetchTest {

	get description () {
		return 'should unset several simple preferences when requested via $unset';
	}

	// pre-set some preferences
	preSetPreferences (callback) {
		this.preSetData = {
			topLevelPreference: {
				preferenceOne: 'one',
				preferenceTwo: 2,
				preferenceThree: 'three',
				preferenceFour: 'four',
				preferenceFive: {
					one: 1,
					two: 'two'
				}
			}
		};
		super.preSetPreferences(callback);
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData (callback) {
		// establish the preferences we expect to see when we verify, in this
		// case, we're unsetting a few subkeys of a preference
		this.data = {
			$unset: {
				topLevelPreference: {
					preferenceOne: 1,
					preferenceThree: true,
					preferenceFive: 2
				}
			}
		};
		this.expectResponse = this.getBaseExpectedResponse();
		this.expectResponse.user.$unset = {
			'preferences.topLevelPreference.preferenceOne': 1,
			'preferences.topLevelPreference.preferenceThree': true,
			'preferences.topLevelPreference.preferenceFive': 2
		};
		this.expectPreferences = this.preSetData;
		delete this.expectPreferences.topLevelPreference.preferenceOne;
		delete this.expectPreferences.topLevelPreference.preferenceThree;
		delete this.expectPreferences.topLevelPreference.preferenceFive;
		callback();
	}
}

module.exports = UnsetSubkeyTest;
