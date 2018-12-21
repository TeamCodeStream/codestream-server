'use strict';

const PutTeamSettingsFetchTest = require('./put_team_settings_fetch_test');

class SetTest extends PutTeamSettingsFetchTest {

	get description () {
		return 'should set several simple team settings when requested via $set';
	}

	// make the data to use in the settings update, and the data we expect to
	// see when we verify
	makeSettingsData (callback) {
		// set some simple settings values
		const set = {
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
		this.data = { $set: set };
		this.expectSettings = set;
		this.expectResponse = {
			team: {
				_id: this.team.id,	// DEPRECATE ME
				id: this.team.id,
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
		this.updatedAt = Date.now();
		callback();
	}
}

module.exports = SetTest;
