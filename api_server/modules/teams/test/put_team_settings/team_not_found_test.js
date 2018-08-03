'use strict';

const PutTeamSettingsTest = require('./put_team_settings_test');
const ObjectID = require('mongodb').ObjectID;

class TeamNotFoundTest extends PutTeamSettingsTest {

	get description () {
		return 'should return an error when an attempt to update settings for a non-existent team is made';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/team-settings/' + ObjectID(); // substitute an ID for a non-existent team
			callback();
		});
	}
}

module.exports = TeamNotFoundTest;
