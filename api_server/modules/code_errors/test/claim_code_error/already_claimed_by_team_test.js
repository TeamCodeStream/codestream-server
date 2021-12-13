'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');

class AlreadyClaimedByTeamTest extends ClaimCodeErrorTest {

	get description () {
		return 'should be ok to claim a code error already claimed by the team, current user should be added as a follower';
	}

	// before the test runs...
	before (callback) {
		this.dontExpectTeamUpdate = true;
		super.before(error => {
			if (error) { return callback(error); }
			this.savedData = this.data;
			// claim it before trying to claim it...
			this.claimCodeError(error => {
				if (error) { return callback(error); }
				this.data = this.savedData;
				callback();
			});
		});
	}
}

module.exports = AlreadyClaimedByTeamTest;
