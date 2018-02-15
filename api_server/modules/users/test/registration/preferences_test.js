'use strict';

var RegistrationTest = require('./registration_test');
const Assert = require('assert');

class PreferencesTest extends RegistrationTest {

	get description () {
		return 'should return the user and preferences when registering a user and providing preferences';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.preferences = {
				x: 1,
				y: 'hello',
				telemetryConsent: false	// this is a real one!
			};
			callback();
		});
	}

	validateResponse (data) {
		Assert.deepEqual(data.user.preferences, this.data.preferences, 'preferences not correct');
		delete data.user.preferences;	// avoid assertion from base validateResponse
		super.validateResponse(data);
	}
}

module.exports = PreferencesTest;
