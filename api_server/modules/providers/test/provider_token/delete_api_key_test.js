'use strict';

const NRLoginTest = require('./nrlogin_test');
const Assert = require('assert');
const { timeStamp } = require('console');
const RandomString = require('randomstring');

class DeleteAPIKeyTest extends NRLoginTest {

	get description () {
		let desc = 'when matching an existing user on New Relic auth, the existing user\'s API key should be destroyed';
		if (this.serviceGatewayEnabled) {
			desc += ', with Service Gateway auth enabled';
		}
		return desc;
	}

	getMockUser () {
		return this.mockUser || super.getMockUser();
	}

	// override base createCompany to do an "NR register", old-fashioned way of signing up a new NR user
	createCompany (callback) {
		this.nrUserId = this.getMockNRUserId();
		this.mockUser = this.getMockUser();
		const { nr_userid, email, name } = this.mockUser;
		const apiKey = RandomString.generate(20);
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/nr-register',
				data: {
					apiKey
				},
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-Mock-Email': this.mockUser.email,
						'X-CS-Mock-Id': this.nrUserId,
						'X-CS-Mock-Name': this.mockUser.name
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				Assert(response.user.providerInfo.newrelic.accessToken === apiKey);
				callback();
			}
		);
	}

	validateResponse (data) {
		Assert(data.user.nrUserId === parseInt(this.mockUser.nr_userid, 10), 'NR User ID of created user does not match mock user data');
		Assert(!data.user.providerInfo.newrelic, 'New Relic providerInfo exists at top level');
		return super.validateResponse(data);
	}
}

module.exports = DeleteAPIKeyTest;
