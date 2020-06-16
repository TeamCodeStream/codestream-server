'use strict';

const PutPreferencesTest = require('./put_preferences_test');

class InvalidOpTest extends PutPreferencesTest {

	get description () {
		return 'should return an error when an invalid update is sent with an update preferences request';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012'
		};
	}

	// make the preferences data that will be used to match when the preferences
	// are retrieved to verify the preferences change was successful
	makePreferencesData (callback) {
		// this op is invalid because it acts on the same preference
		this.data = {
			$set: { a: 1 },
			$unset: { a: 1 }
		};
		callback();
	}
}

module.exports = InvalidOpTest;
