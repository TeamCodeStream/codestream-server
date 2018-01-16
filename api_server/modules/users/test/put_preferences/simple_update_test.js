'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class SimpleUpdateTest extends PutPreferencesTest {

	get description () {
		return 'should set several simple preferences when requested';
	}

	makePreferencesData () {
		this.expectPreferences = {
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
		return this.expectPreferences;
	}
}

module.exports = SimpleUpdateTest;
