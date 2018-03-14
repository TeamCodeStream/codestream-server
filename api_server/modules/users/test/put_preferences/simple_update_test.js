'use strict';

var PutPreferencesTest = require('./put_preferences_test');

class SimpleUpdateTest extends PutPreferencesTest {

	get description () {
		return 'should set several simple preferences when requested';
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData () {
		// the base class specifies the default update, 
		// we expect to see what we set
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
