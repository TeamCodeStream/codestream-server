'use strict';

const PutTeamSettingsTest = require('./put_team_settings_test');

class AdminsOnlyTest extends PutTeamSettingsTest {

	constructor (options) {
		super(options);
		this.wantOtherUser = true;
	}

	get description () {
		return 'should return an error when a non-admin tries to change team settings';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = AdminsOnlyTest;
