'use strict';

const GetAuthSettingsTest = require('./get_auth_settings_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends GetAuthSettingsTest {

	get description() {
		return 'should return an error when attempting to fetch auth settings for a non-existent team';
	}

	getExpectedError() {
		return {
			code: 'RAPI-1003',
			info: 'team'
		};
	}

	// before the test runs...
	before(callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = `/no-auth/teams/${ObjectID()}/auth-settings`; // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
