'use strict';

const ProviderHostTest = require('./provider_host_test');

class HostRequiredTest extends ProviderHostTest {

	get description () {
		return 'should return an error when trying to add a provider host for a team and the host is not specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'host'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(); }
			delete this.data.host;
			callback();
		});
	}
}

module.exports = HostRequiredTest;
