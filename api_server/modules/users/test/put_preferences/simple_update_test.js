'use strict';

var PutPreferencesFetchTest = require('./put_preferences_fetch_test');

class SimpleUpdateTest extends PutPreferencesFetchTest {

	get description () {
		return 'should set several simple preferences when requested';
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData (callback) {
		this.expectPreferences = this.data = {
			preferenceOne: 1,
			preferenceTwo: 'two',
			preferenceThree: {
				threeA: 'A',
				threeB: 'Bee'
			},
			preferenceFour: {
				level: {
					one: 1,
					two: 'two'
				}
			}
		};
		this.expectResponse = {
			user: {
				_id: this.currentUser._id,
				$set: {
					'preferences.preferenceOne': 1,
					'preferences.preferenceTwo': 'two',
					'preferences.preferenceThree.threeA': 'A',
					'preferences.preferenceThree.threeB': 'Bee',
					'preferences.preferenceFour.level.one': 1,
					'preferences.preferenceFour.level.two': 'two'
				}
			}
		};
		callback();
	}
}

module.exports = SimpleUpdateTest;
