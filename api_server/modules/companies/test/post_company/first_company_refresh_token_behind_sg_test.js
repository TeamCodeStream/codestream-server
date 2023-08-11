'use strict';

const RefreshTokenBegindSGTest = require('./refresh_token_behind_sg_test');

class FirstCompanyRefreshTokenBehindSGTest extends RefreshTokenBegindSGTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex; // this suppresses creation of default test company
	}

	get description () {
		return 'under Unified Identity, and running behind Service Gateway, user creating their first company should receive an updated New Relic access token on their me-channel, after creating a new org';
	}
}

module.exports = FirstCompanyRefreshTokenBehindSGTest;
