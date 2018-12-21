'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');
const ComplexUpdate = require('./complex_update');

class ComplexUpdateTest extends PutTeamSettingsFetchTest {

	get description () {
		return 'should set and unset the correct properties when a complex team settings update is requested';
	}

	// pre-set the team settings, which we'll update for the test
	preSetSettings (callback) {
		// pre-set with some "complex" data
		this.preSetData = ComplexUpdate.INITIAL_SETTINGS;
		super.preSetSettings(callback);
	}

	// make the settings data that will be used to match when the settings
	// are retrieved to verify the settings change was successful
	makeSettingsData (callback) {
		this.data = ComplexUpdate.UPDATE_OP;
		this.expectResponse = {
			team: Object.assign({}, {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id
			}, ComplexUpdate.EXPECTED_OP)
		};
		this.expectSettings = ComplexUpdate.EXPECTED_SETTINGS;
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = ComplexUpdateTest;
