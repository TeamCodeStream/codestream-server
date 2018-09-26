'use strict';

var PutPreferencesFetchTest = require('./put_preferences_fetch_test');

class SetTest extends PutPreferencesFetchTest {

	get description () {
		return 'should set several simple preferences when requested via $set';
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData (callback) {
		// set some simple preferences values
		const set = {
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
		this.data = { $set: set };
		this.expectPreferences = set;
		this.expectResponse = this.getBaseExpectedResponse();
		Object.assign(this.expectResponse.user.$set, {
			'preferences.preferenceOne': 1,
			'preferences.preferenceTwo': 'two',
			'preferences.preferenceThree.threeA': 'A',
			'preferences.preferenceThree.threeB': 'Bee',
			'preferences.preferenceFour.level.one': 1,
			'preferences.preferenceFour.level.two': 'two'
		});
		callback();
	}
}

module.exports = SetTest;
