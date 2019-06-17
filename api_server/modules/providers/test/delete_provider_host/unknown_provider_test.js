'use strict';

const DeleteProviderHostTest = require('./delete_provider_host_test');

class UnknownProviderTest extends DeleteProviderHostTest {

	get description () {
		return 'should return an error when trying to delete a provider host for a team and the provider is not one of the known providers';
	}

	getExpectedError () {
		return {
			code: 'USRC-1013'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(); }
			const starredHost = this.host.replace(/\./g, '*');
			this.path = `/provider-host/unknown/${this.team.id}/${starredHost}`;
			callback();
		});
	}
}

module.exports = UnknownProviderTest;
