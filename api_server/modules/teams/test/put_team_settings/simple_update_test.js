'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');

class SimpleUpdateTest extends PutTeamSettingsFetchTest {

	get description () {
		return 'should set several simple team settings when requested';
	}

	// make the data to use in the team settings update, and the data we expect to
	// see when we verify
	makeSettingsData (callback) {
		this.expectSettings = this.data = {
			settingOne: 1,
			settingTwo: 'two',
			settingThree: {
				threeA: 'A',
				threeB: 'Bee'
			},
			settingFour: {
				level: {
					one: 1,
					two: 'two'
				}
			}
		};
		this.expectResponse = {
			team: {
				_id: this.team._id,
				$set: {
					'settings.settingOne': 1,
					'settings.settingTwo': 'two',
					'settings.settingThree.threeA': 'A',
					'settings.settingThree.threeB': 'Bee',
					'settings.settingFour.level.one': 1,
					'settings.settingFour.level.two': 'two'
				}
			}
		};
		callback();
	}
}

module.exports = SimpleUpdateTest;
