'use strict';

const NRRegistrationTest = require('./nr_registration_test');

class StagingApiTest extends NRRegistrationTest {

	get description () {
		return 'should return correct user data when using staging region';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.apiRegion = 'staging';
			this.expectedUserData.providerInfo.newrelic.data.apiUrl = 'https://staging-api.newrelic.com';
			callback();
		});
	}
}

module.exports = StagingApiTest;
