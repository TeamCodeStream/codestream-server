'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');

class SetSubkeyTest extends PutTeamSettingsFetchTest {

	get description () {
		return 'should set several team setting subkeys when requested via $set';
	}

	// pre-set some settings data before running the test
	preSetSettings (callback) {
		this.preSetData = {
			topLevelSetting: {
				settingOne: 'one',
				settingTwo: 2
			}
		};
		super.preSetSettings(callback);
	}

	// make the settings data to set for the test, and the data we expect
	// to get back when we verify
	makeSettingsData (callback) {
		// establish the settings we expect to see when we verify, in this
		// case, we're setting a subkey of a setting
		const set = {
			topLevelSetting: {
				settingThree: 'three',
				settingFour: 4
			}
		};
		this.data = { $set: set };
		this.expectResponse = {
			team: {
				_id: this.team._id,
				$set: {
					'settings.topLevelSetting.settingThree': 'three',
					'settings.topLevelSetting.settingFour': 4
				}
			}
		};
		this.expectSettings = this.preSetData;
		Object.assign(this.expectSettings.topLevelSetting, set.topLevelSetting);
		callback();
	}
}

module.exports = SetSubkeyTest;
