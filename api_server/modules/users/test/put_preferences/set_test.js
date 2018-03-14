'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class SetTest extends PutPreferencesTest {

	get description () {
		return 'should set several simple preferences when requested via $set';
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData () {
		// set some simple preferences values
		let set = {
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
		// we expect to see what we set
		this.expectPreferences = set;
		return { $set: set };
	}
}

module.exports = SetTest;
