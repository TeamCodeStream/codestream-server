'use strict';

const ProviderInfoTest = require('./provider_info_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends ProviderInfoTest {

	get description () {
		return 'should return an error when trying to set provider info for a team that doesn\'t exist';
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
