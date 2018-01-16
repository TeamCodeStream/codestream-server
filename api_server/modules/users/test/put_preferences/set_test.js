'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class SetTest extends PutPreferencesTest {

	get description () {
		return 'should set several simple preferences when requested via $set';
	}

	makePreferencesData () {
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
		this.expectPreferences = set;
		return { $set: set };
	}
}

module.exports = SetTest;
