'use strict';

const RefreshTokenFetchTest = require('./refresh_token_fetch_test');

class FirstCompanyRefreshTokenFetchTest extends RefreshTokenFetchTest {

	constructor (options) {
		super(options);
		delete this.teamOptions.creatorIndex; // this suppresses creation of default test company
	}

	get description () {
		return 'under Unified Identity, user creating their first company should get an updated New Relic access token, after creating a new org, checked by fetching the user';
	}
}

module.exports = FirstCompanyRefreshTokenFetchTest;
