'use strict';

var TeamsEnableFetchTest = require('./teams_enable_fetch_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class EnableThenDisableTest extends TeamsEnableFetchTest {

	constructor (options) {
		super(options);
		this.wantDisabled = true;
	}

	get description () {
		return 'should disable MS Teams integration when requested, after it was enabled, verified by fetching the team info';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// create team and repo, and enable teams integration
			this.disableTeams	// now disable teams integration, we'll verify by fetching the team
		], callback);
	}

	// disable teams integration, after it has been enabled
	disableTeams (callback) {
		// set enable flag to false, and call enableTeams again, this should actually disable
		this.data = this.previousData;
		this.data.enable = false;
		this.enableTeams(callback);
	}
}

module.exports = EnableThenDisableTest;
