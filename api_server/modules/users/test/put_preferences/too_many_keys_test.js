'use strict';

const PutPreferencesTest = require('./put_preferences_test');

class TooManyKeysTest extends PutPreferencesTest {

	get description () {
		return 'should return an error when the there are too many keys provided in a preferences update request';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: 'too many keys'
		};
	}

	// make the data to use in the preferences update, and the data we expect to
	// see when we verify
	makePreferencesData (callback) {
		// establish preferences data that exceeds the limit of how many keys
		// we can provide at one time in an update
		this.data = {};
		for (let i = 0; i < 10; i++) {
			this.data[i] = {};
			for (let j = 0; j < 5; j++) {
				this.data[i][j] = {};
				for (let k = 0; k < 3; k++) {
					this.data[i][j][k] = `${i}${j}${k}`;
				}
			}
		}
		callback();
	}
}

module.exports = TooManyKeysTest;
