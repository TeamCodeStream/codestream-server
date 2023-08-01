'use strict';

const RefreshTokenTest = require('./refresh_token_test');

class FirstCompanyRefreshTokenTest extends RefreshTokenTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex; // this suppresses creation of default test company
	}

	get description () {
		return 'under Unified Identity, user creating their first company should receive an updated New Relic access token on their me-channel, after creating a new org';
	}
}

module.exports = FirstCompanyRefreshTokenTest;
