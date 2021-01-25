'use strict';

const GitLensUserTest = require('./gitlens_user_test');

class MachineIdOptionalTest extends GitLensUserTest {

	get description () {
		return 'should be ok not to provide a machine ID hash when creating a GitLens user';
	}

	// before the test runs...
	before (callback) {
		// delete the machine ID from the data to submit with the request
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.machineIdHash;
			callback();
		});
	}
}

module.exports = MachineIdOptionalTest;
