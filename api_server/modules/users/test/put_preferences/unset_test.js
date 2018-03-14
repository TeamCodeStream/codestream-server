'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class UnsetTest extends PutPreferencesTest {

	get description () {
		return 'should unset a preference value when requested';
	}

	// pre-set some preferences
	preSetPreferences (callback) {
		this.preSetData = {
			preferenceOne: true,
			preferenceTwo: false
		};
		this.putPreferences(this.preSetData, callback);
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData () {
		// we expect to see the data we initiall set, minute the key we're deleting
		this.expectPreferences = this.preSetData;
		delete this.expectPreferences.preferenceTwo;
		return { $unset: { preferenceTwo: 1 } };
	}
}

module.exports = UnsetTest;
