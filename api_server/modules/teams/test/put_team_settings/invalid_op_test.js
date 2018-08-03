'use strict';

const PutTeamSettingsTest = require('./put_team_settings_test');

class InvalidOpTest extends PutTeamSettingsTest {

	get description () {
		return 'should return an error when an invalid update is sent with an update team settings request';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012'
		};
	}

	// make the settings data that will be used to match when the settings
	// are retrieved to verify the settings change was successful
	makeSettingsData (callback) {
		// this op is invalid because it acts on the same setting
		this.data = {
			$set: { a: 1 },
			$unset: { a: 1 }
		};
		callback();
	}
}

module.exports = InvalidOpTest;
