'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');

class UnsetTest extends PutTeamSettingsFetchTest {

	get description () {
		return 'should unset a team setting value when requested';
	}

	// pre-set some settings
	preSetSettings (callback) {
		this.preSetData = {
			settingOne: true,
			settingTwo: false
		};
		super.preSetSettings(callback);
	}

	// make the data to use in the settings update, and the data we expect to
	// see when we verify
	makeSettingsData (callback) {
		// we expect to see the data we initial set, minus the key we're deleting
		this.data = {
			$unset: {
				settingTwo: 1
			}
		};
		this.expectResponse = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$unset: {
					'settings.settingTwo': true
				}
			}
		};
		this.expectSettings = Object.assign({}, this.preSetData);
		delete this.expectSettings.settingTwo;
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = UnsetTest;
