'use strict';

var PutPreferencesFetchTest = require('./put_preferences_fetch_test');

class UnsetTest extends PutPreferencesFetchTest {

	get description () {
		return 'should unset a preference value when requested';
	}

	// pre-set some preferences
	preSetPreferences (callback) {
		this.preSetData = {
			preferenceOne: true,
			preferenceTwo: false
		};
		super.preSetPreferences(callback);
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData (callback) {
		// we expect to see the data we initial set, minus the key we're deleting
		this.data = {
			$unset: {
				preferenceTwo: 1
			}
		};
		this.expectResponse = {
			user: {
				_id: this.currentUser._id,
				$unset: {
					'preferences.preferenceTwo': true
				}
			}
		};
		this.expectPreferences = Object.assign({}, this.preSetData);
		delete this.expectPreferences.preferenceTwo;
		callback();
	}
}

module.exports = UnsetTest;
