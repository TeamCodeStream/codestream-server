'use strict';

const ProviderHostTest = require('./provider_host_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends ProviderHostTest {

	get description () {
		return 'should return an error when trying to set a provider host for a team that doesn\'t exist';
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
			this.path = `/provider-host/${this.provider}/${ObjectID()}`; // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
