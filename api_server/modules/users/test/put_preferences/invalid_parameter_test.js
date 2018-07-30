'use strict';

const PutPreferencesTest = require('./put_preferences_test');

class InvalidParameterTest extends PutPreferencesTest {

	get description () {
		return 'should return an error when the value of a directive in a preferences request is not set to the value of an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: '\\$set'
		};
	}

	// make the preferences data that will be used to match when the preferences
	// are retrieved to verify the preferences change was successful
	makePreferencesData (callback) {
		super.makePreferencesData(() => {
			// the value of $set must be an object
			this.data = {
				$set: 'x'
			};
			callback();
		});
	}
}

module.exports = InvalidParameterTest;
