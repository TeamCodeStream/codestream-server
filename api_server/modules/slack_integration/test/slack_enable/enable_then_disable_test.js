'use strict';

var SlackEnableFetchTest = require('./slack_enable_fetch_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class EnableThenDisableTest extends SlackEnableFetchTest {

	constructor (options) {
		super(options);
		this.wantDisabled = true;
	}

	get description () {
		return 'should disable slack integration when requested, after it was enabled, verified by fetching the team info';
	}

	// before the test runs..
	before (callback) {
		BoundAsync.series(this, [
			super.before,		// create team and repo, and enable slack integration
			this.disableSlack	// now disable slack integration, we'll verify by fetching the team
		], callback);
	}

	// disable slack integration, after it has been enabled
	disableSlack (callback) {
		// set enable flag to false, and call enableSlack again, this should actually disable
		this.data = this.previousData;
		this.data.enable = false;
		this.enableSlack(callback);
	}
}

module.exports = EnableThenDisableTest;
