'use strict';

var PutPreferencesFetchTest = require('./put_preferences_fetch_test');
const ComplexUpdate = require('./complex_update');

class ComplexUpdateTest extends PutPreferencesFetchTest {

	get description () {
		return 'should set and unset the correct properties when a complex preferences update is requested';
	}

	// pre-set the user preferences, which we'll update for the test
	preSetPreferences (callback) {
		// pre-set with some "complex" data
		this.preSetData = ComplexUpdate.INITIAL_PREFERENCES;
		super.preSetPreferences(callback);
	}

	// make the preferences data that will be used to match when the preferences
	// are retrieved to verify the preferences change was successful
	makePreferencesData (callback) {
		this.data = ComplexUpdate.UPDATE_OP;
		this.expectResponse = {
			user: Object.assign({}, {
				_id: this.currentUser._id
			}, ComplexUpdate.EXPECTED_OP)
		};
		this.expectPreferences = ComplexUpdate.EXPECTED_PREFERENCES;
		callback();
	}
}

module.exports = ComplexUpdateTest;
