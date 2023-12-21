'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const UUID = require('uuid').v4;

class NRLoginTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.serviceGatewayEnabled = true; // this is always on now, as per Unified Identity release
	}

	get description () {
		let desc = 'should create a user and set an access token for the user when completing a cross-environment New Relic authorization flow';
		if (this.serviceGatewayEnabled) {
			desc += ', and set CodeStream access token with Service Gateway auth enabled';
		}
		return desc;
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.createCompany,		// create existing company, as needed
			this.waitForCompanySignup, // wait for the created company to exist and result in a valid signup token
			this.doNRLogin,			// make the login request
			this.wait,				// wait for signup token to be saved
			this.waitForSignupToken	// wait for our signup token to be validated
		], callback);
	}

	setTestOptions (callback) {
		// by default, we will have no teams and no users created ahead of time,
		// then we will test the scenario where these are actually created in 
		// conjunction with the authentication
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		callback();
	}

	// create an existing company, linked to an NR org, as needed
	createCompany (callback) {
		if (!this.wantExistingCompany) { return callback(); }

		// do an ~nrlogin, with random user, this will create a company linked to a random NR org
		this.signupToken = UUID();
		const mockUser = this.getMockUser();
		const headers = {
			'X-CS-NR-Mock-User': JSON.stringify(mockUser),
			'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat
		};

		const path = `/~nrlogin/${this.signupToken}?auth_code=${RandomString.generate(100)}`;
		this.doApiRequest(
			{
				method: 'get',
				path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true,
					headers
				}
			},
			callback
		);
	}

	// wait for the company created in the last step to exist, when the signup token is valid
	waitForCompanySignup (callback) {
		if (!this.wantExistingCompany) { return callback(); }

		setTimeout(() => {
			this.doApiRequest(
				{
					method: 'put',
					path: '/no-auth/check-signup',
					data: {
						token: this.signupToken
					}
				},
				(error, data) => {
					if (error) { return callback(error); }
					this.createCompanyResponse = data;
					callback();
				}
			);
		}, 1000);
	}

	// make the nrlogin request to set the user's access token for the given provider,
	// and perform whatever identity matching we expect to happen
	// the actual test is fetching the user object and verifying the token has been set
	// note that this is a mock test, there is no actual call made to the provider
	doNRLogin (callback) {
		this.mockUser = this.getMockUser();
		this.nrUserId = this.nrUserId || this.getMockNRUserId();
		this.tokenType = this.wantIDToken ? 'id' : 'access';
		const type = this.wantIDToken ? 'MNRI' : 'MNRA';
		const refreshType = this.wantIDToken ? 'MNRRI' : 'MNRRA';
		this.nrToken = this.makeMockNRToken(this.nrUserId, type, this.mockUser);
		this.nrRefreshToken = this.makeMockNRToken(this.nrUserId, refreshType, this.mockUser);
		this.signupToken = UUID();
		if (this.wantIDToken) {
			this.mockUser.wantIDToken = true;
		}
		const headers = {
			'X-CS-NR-Mock-User': JSON.stringify(this.mockUser),
			'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat,
			'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
		};
		const data = this.getData();
		if (this.wantError) {
			this.method = 'post';
			this.path = '/xenv/nrlogin';
			this.data = data;
			this.apiRequestOptions = { headers };
			return callback();
		}

		this.path = '/users/me';
		this.doApiRequest(
			{
				method: 'post',
				path: '/xenv/nrlogin',
				data,
				requestOptions: {
					headers
				}
			},
			(error, data, response) => {
				this.nrTokenResponse = response;
				this.nrTokenData = data;
				callback(error);
			}
		);
	}

	// get the request body to use for the test
	getData () {
		return {
			token: this.nrToken,
			signupToken: this.signupToken,
			tokenType: this.tokenType,
			nrOrgId: this.mockUser.nr_orgid,
			email: this.mockUser.email,
			refreshToken: this.nrRefreshToken,
			nrUserId: this.nrUserId,
			expiresAt: Date.now() + 60 * 60 * 1000,
			username: this.mockUser.email.split('@')[0],
			fullName: this.mockUser.name,
			companyName: this.companyFactory.randomName(),
			_pubnubUuid: this.userFactory.getNextPubnubUuid()
		};
	}

	// get a mock user to use for the request
	getMockUser () {
		return  {
			email: this.userFactory.randomEmail(),
			name: this.userFactory.randomFullName(),
			nr_userid: this.nrUserId || this.getMockNRUserId(),
			nr_orgid: UUID(),
		};
	}

	makeMockNRToken (nrUserId, type, payload = {}) {
		const encoded = Buffer.from(JSON.stringify(payload)).toString('base64');
		return `${type}-${nrUserId}-${encoded}-${RandomString.generate(100)}`;
	}

	// wait for the signup token to be saved before we start checking
	wait (callback) {
		if (this.wantError) { return callback(); }
		setTimeout(callback, 1000);
	}

	// wait for our signup token to be validated ... just like the IDE, we use the signup token
	// to know when authentication is complete
	waitForSignupToken (callback) {
		if (this.wantError) { return callback(); }
		this.numAttempts = 0;
		BoundAsync.whilst(
			this,
			() => { 
				return !this.signupResponse && this.numAttempts < 10; 
			},
			this.checkSignupToken,
			error => {
				if (error) { return callback(error); }
				if (!this.signupResponse) {
					return callback('signup token never validated');
				} else {
					return callback();
				}
			}
		);
	}
	
	// check our signup token, when it is valid, we have a CodeStream user
	checkSignupToken (callback) {
		// check our signup token, when we get a valid response, we're done
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/check-signup',
				data: {
					token: this.signupToken
				}
			},
			(error, data) => {
				if (error) { 
					if (data.code === 'AUTH-1006') {
						this.numAttempts++;
						setTimeout(callback, 1000);
					} else if (this.wantError) {
						this.signupError = data;
						this.signupResponse = true;
						callback();
					} else {
						callback(error);
					}
				}
				else {
					this.signupResponse = data;
					this.token = this.signupResponse.accessToken;
					callback();
				}
			}
		);
	}

	getMockNRUserId () {
		return (1000000000 + Math.floor(Math.random() * 999999999));
	}

	// validate the response to the test request
	validateResponse (data) {
		if (this.wantError) {
			return this.validateErrorResponse(data);
		}

		// verify that the correct provider info made its way into the user object created
		const { user } = data;
		const teamId = this.team ? this.team.id : this.signupResponse.teams[0].id;
		const providerInfo = user.providerInfo[teamId].newrelic;
		if (this.mockUser.wantIDToken) {
			Assert(providerInfo.accessToken.startsWith('MNRI-'), 'not a valid mock id token');
			Assert(providerInfo.refreshToken.startsWith('MNRRI-'), 'not a valid mock refresh token');
		} else {
			Assert(providerInfo.accessToken.startsWith('MNRA-'), 'not a valid mock access token');
			Assert(providerInfo.refreshToken.startsWith('MNRRA-'), 'not a valid mock refresh token');
		}
		const expectedProviderInfo = {
			accessToken: providerInfo.accessToken,
			bearerToken: true,
			refreshToken: providerInfo.refreshToken,
			expiresAt: Date.now(),
			tokenType: this.wantIDToken ? 'id' : 'access'
		};
		Assert(providerInfo.expiresAt > Date.now(), 'expiresAt not in the future');
		expectedProviderInfo.expiresAt = providerInfo.expiresAt;
		Assert.deepStrictEqual(providerInfo, expectedProviderInfo, 'providerInfo not correct');
		Assert.strictEqual(user.nrUserId, parseInt(this.nrUserId, 10), 'provider userId does not match expected userId');

		if (this.serviceGatewayEnabled) {
			const { accessToken, accessTokenInfo } = this.signupResponse;
			const { refreshToken, expiresAt, provider, isNRToken } = accessTokenInfo;
			Assert.strictEqual(accessToken, providerInfo.accessToken, 'CodeStream access token not set to the NR access token');
			Assert.strictEqual(refreshToken, providerInfo.refreshToken, 'CodeStream refresh token not set to the NR refresh token');
			Assert.strictEqual(expiresAt, providerInfo.expiresAt, 'CodeStream access token expiresAt not set to the NR expiresAt');
			Assert.strictEqual(isNRToken, true, 'CodeStream access token isNRToken not set to true');
		}
	}
}

module.exports = NRLoginTest;
