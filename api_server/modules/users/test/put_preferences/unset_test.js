'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class UnsetTest extends PutPreferencesTest {

	get description () {
		return 'should unset a preference value when requested';
	}

	preSetPreferences (callback) {
		this.preSetData = {
			preferenceOne: true,
			preferenceTwo: false
		};
		this.putPreferences(this.preSetData, callback);
	}

	makePreferencesData () {
		this.expectPreferences = this.preSetData;
		delete this.expectPreferences.preferenceTwo;
		return { $unset: { preferenceTwo: 1 } };
	}
}

module.exports = UnsetTest;
