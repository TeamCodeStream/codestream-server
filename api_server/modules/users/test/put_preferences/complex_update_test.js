'use strict';

var PutPreferencesTest = require('./put_preferences_test');
const ComplexUpdate = require('./complex_update');

class ComplexUpdateTest extends PutPreferencesTest {

	get description () {
		return 'should set and unset the correct properties when a complex preferences update is requested';
	}

	// pre-set the user preferences, which we'll update for the test
	preSetPreferences (callback) {
		// pre-set with some "complex" data
		this.preSetData = ComplexUpdate.INITIAL_PREFERENCES;
		this.putPreferences(this.preSetData, callback);
	}

	makePreferencesData () {
		this.expectPreferences = ComplexUpdate.EXPECTED_PREFERENCES;
		return ComplexUpdate.UPDATE_OP;
	}
}

module.exports = ComplexUpdateTest;
