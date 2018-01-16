'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class UnsetSubkeyTest extends PutPreferencesTest {

	get description () {
		return 'should unset several simple preferences when requested via $unset';
	}

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

	makePreferencesData () {
		this.expectPreferences = this.preSetData;
		delete this.expectPreferences.topLevelPreference.preferenceOne;
		delete this.expectPreferences.topLevelPreference.preferenceThree;
		delete this.expectPreferences.topLevelPreference.preferenceFive;
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
