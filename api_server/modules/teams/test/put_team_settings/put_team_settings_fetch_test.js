'use strict';

const PutTeamSettingsTest = require('./put_team_settings_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class PutTeamSettingsFetchTest extends PutTeamSettingsTest {

	get description () {
		return 'should set a simple team setting when requested, checked by fetching the team\'s settings';
	}

	// run the actual test...
	run (callback) {
		// we'll run the settings update, but also verify the update took by fetching and validating
		// the team object
		BoundAsync.series(this, [
			super.run,
			this.validateTeamObject
		], callback);
	}

	// fetch and validate the team object against the settings update we made
	validateTeamObject (callback) {
		this.doApiRequest({
			method: 'get',
			path: '/teams/' + this.team.id,
			token: this.token
		}, (error, response) => {
			if (error) { return callback(error); }
			Assert.deepEqual(response.team.settings, this.expectSettings);
			callback();
		});
	}
}

module.exports = PutTeamSettingsFetchTest;
