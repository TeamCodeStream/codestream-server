'use strict';

const RegistrationTest = require('./registration_test');
const Assert = require('assert');

class PreferencesTest extends RegistrationTest {

	get description () {
		return 'should return the user and preferences when registering a user and providing preferences';
	}

	// before the test runs...
	before (callback) {
		// do standard registration, then add some preferences that will be provided
		// in the registration process
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

	// validate the response to the test request
	validateResponse (data) {
		// we expect to see the preferences in the response, but since the base-class doesn't
		// know about this, delete the preferences object after we validate
		Assert.deepEqual(data.user.preferences, this.data.preferences, 'preferences not correct');
		delete data.user.preferences;	// avoid assertion from base validateResponse
		super.validateResponse(data);
	}
}

module.exports = PreferencesTest;
