'use strict';

const ProviderSetTokenTest = require('./provider_set_token_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends ProviderSetTokenTest {

	get description () {
		return 'should return an error when trying to set a provider token for a team that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.teamId = ObjectID(); // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
