'use strict';

const { Console } = require('console');
const PostCompanyTest = require('./post_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class RefreshTokenFetchTest extends PostCompanyTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}
	
	get description () {
		return 'under Unified Identity, current user should get an updated New Relic access token, after creating a new org, checked by fetching the user record';
	}

	get method () {
		return 'put';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCompany,
			this.waitForIDPSignup,
			this.loginUser,
			this.waitForRefresh
		], callback);
	}

	// wait a bit for the IDP signup process to complete, since that happens post-response
	// since this will be a mock resonse, we shouldn't have to wait long
	waitForIDPSignup (callback) {
		setTimeout(callback, 1000);
	}

	// login the user for the company just created
	loginUser (callback) {
		let token, nrUserId;
		if (this.createCompanyResponse.accessToken) {
			token = this.createCompanyResponse.accessToken;
			nrUserId = this.createCompanyResponse.user.nrUserId;
		} else {
			token = this.token;
			nrUserId = this.currentUser.user.nrUserId;
		}
		this.doApiRequest(
			{
				method: 'put',
				path: '/login',
				token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.loginResponse = response;
				callback();
			}
		);
	}

	waitForRefresh (callback) {
		this.path = '/login';
		this.token = this.createCompanyResponse.accessToken || this.token;
		setTimeout(callback, this.mockMode ? 1500 : 11000);
	}

	validateResponse (data) {
		// ensure the token we now see is not the same as the one originally issued
		const teamId = this.createCompanyResponse.teamId || this.createCompanyResponse.team.id;
		const originalProviderInfo = this.loginResponse.user.providerInfo[teamId].newrelic;
		const providerInfo = data.user.providerInfo[teamId].newrelic;
		Assert.notStrictEqual(providerInfo.accessToken, originalProviderInfo.accessToken, 'access token on fetch is the same as the one originally issued');
	}
}

module.exports = RefreshTokenFetchTest;
