'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class ClaimedByOtherTeamTest extends ClaimCodeErrorTest {

	get description () {
		return 'should return data relevant to the claim when trying to claim a code error that has already been claimed by another team';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createOtherTeam,
			this.claimCodeError,
			this.restoreData
		], callback);
	}

	createOtherTeam (callback) {
		this.savedData = this.data;
		this.companyFactory.createRandomCompany(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherTeam = response.team;
				this.otherCompany = response.company;
				this.claimByTeamId = this.otherTeam.id;
				this.claimByToken = this.users[1].accessToken;
				callback();
			}, {
				token: this.users[1].accessToken
			}
		);
	}

	restoreData (callback) {
		this.data = this.savedData;
		callback();
	}

	validateResponse (data) {
		Assert.deepStrictEqual(data, {
			unauthorized: true,
			accountId: this.nrCommentResponse.post.accountId,
			ownedBy: this.otherCompany.name
		}, 'incorrect response');
	}
}

module.exports = ClaimedByOtherTeamTest;
