'use strict';

const ProviderHostTest = require('./provider_host_test');

class UnknownProviderTest extends ProviderHostTest {

	get description () {
		return 'should return an error when trying to add a provider host for a team and the provider is not one of the known providers';
	}

	getExpectedError () {
		return {
			code: 'PRVD-1000'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(); }
			this.path = `/provider-host/unknown/${this.team.id}`;
			callback();
		});
	}
}

module.exports = UnknownProviderTest;
