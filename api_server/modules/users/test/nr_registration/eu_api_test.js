'use strict';

const NRRegistrationTest = require('./nr_registration_test');

class EuApiTest extends NRRegistrationTest {

	get description () {
		return 'should return correct user data when using eu region';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.apiRegion = 'eu';
			this.expectedUserData.providerInfo.newrelic.data.apiUrl = 'https://api.eu.newrelic.com';
			callback();
		});
	}
}

module.exports = EuApiTest;
