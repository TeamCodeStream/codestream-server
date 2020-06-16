'use strict';

const PutTeamSettingsTest = require('./put_team_settings_test');

class InvalidParameterTest extends PutTeamSettingsTest {

	get description () {
		return 'should return an error when the value of a directive in a team settings request is not set to the value of an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: '\\$set'
		};
	}

	// make the settings data that will be used to match when the settings
	// are retrieved to verify the settings change was successful
	makeSettingsData (callback) {
		super.makeSettingsData(() => {
			// the value of $set must be an object
			this.data = {
				$set: 'x'
			};
			callback();
		});
	}
}

module.exports = InvalidParameterTest;
