'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');

class UnsetSubkeyTest extends PutTeamSettingsFetchTest {

	get description () {
		return 'should unset several simple team settings when requested via $unset';
	}

	// pre-set some settings
	preSetSettings (callback) {
		this.preSetData = {
			topLevelSetting: {
				settingOne: 'one',
				settingTwo: 2,
				settingThree: 'three',
				settingFour: 'four',
				settingFive: {
					one: 1,
					two: 'two'
				}
			}
		};
		super.preSetSettings(callback);
	}

	// make the data to use in the settings update, and the data we expect to
	// see when we verify
	makeSettingsData (callback) {
		// establish the settings we expect to see when we verify, in this
		// case, we're unsetting a few subkeys of a setting
		this.data = {
			$unset: {
				topLevelSetting: {
					settingOne: 1,
					settingThree: true,
					settingFive: 2
				}
			}
		};
		this.expectResponse = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
				$unset: {
					'settings.topLevelSetting.settingOne': 1,
					'settings.topLevelSetting.settingThree': true,
					'settings.topLevelSetting.settingFive': 2
				}
			}
		};
		this.expectSettings = this.preSetData;
		delete this.expectSettings.topLevelSetting.settingOne;
		delete this.expectSettings.topLevelSetting.settingThree;
		delete this.expectSettings.topLevelSetting.settingFive;
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = UnsetSubkeyTest;
