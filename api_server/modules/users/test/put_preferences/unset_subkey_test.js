'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class UnsetSubkeyTest extends PutPreferencesTest {

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
		this.putPreferences(this.preSetData, callback);
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData () {
		// establish the preferences we expect to see when we verify, in this
		// case, we're unsetting a few subkeys of a preference
		this.expectPreferences = this.preSetData;
		delete this.expectPreferences.topLevelPreference.preferenceOne;
		delete this.expectPreferences.topLevelPreference.preferenceThree;
		delete this.expectPreferences.topLevelPreference.preferenceFive;
		// return the actual preferences op that will be performed
		return {
			$unset: {
				topLevelPreference: {
					preferenceOne: 1,
					preferenceThree: true,
					preferenceFive: 1
				}
			}
		};
	}
}

module.exports = UnsetSubkeyTest;
