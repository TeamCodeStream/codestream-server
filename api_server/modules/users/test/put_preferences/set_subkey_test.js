'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class SetSubkeyTest extends PutPreferencesTest {

	get description () {
		return 'should set several simple preferences when requested via $set';
	}

	preSetPreferences (callback) {
		this.preSetData = {
			topLevelPreference: {
				preferenceOne: 'one',
				preferenceTwo: 2
			}
		};
		this.putPreferences(this.preSetData, callback);
	}

	makePreferencesData () {
		this.expectPreferences = this.preSetData;
		this.expectPreferences.topLevelPreference.preferenceThree = 'three';
		this.expectPreferences.topLevelPreference.preferenceFour = 4;
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
