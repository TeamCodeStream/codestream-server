'use strict';

const DeleteProviderHostTest = require('./delete_provider_host_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends DeleteProviderHostTest {

	get description () {
		return 'should return an error when trying to delete a provider host for a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			const starredHost = encodeURIComponent(this.host.replace(/\./g, '*'));
			this.path = `/provider-host/${this.provider}/${ObjectID()}/${starredHost}`; // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
