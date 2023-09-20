'use strict';

const GetMyselfTest = require('./get_myself_test');
const Assert = require('assert');

class PossibleAuthDomainsTest extends GetMyselfTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}

	get description () {
		return 'should return possible auth domains when requesting myself' + (this.id ? ' by id' : '' + ', under unified identity');
	}

	// validate the response to the test request
	validateResponse (data) {
console.warn('RESPONSE:', JSON.stringify(data.user.possibleAuthDomains, 0, 5));
/*
    {
          "authentication_domain_id": "d491f710-cc5c-4961-91b1-a2f4892b935c",
          "authentication_domain_name": "Default",
          "authentication_type": "password",
          "organization_id": "6462e403-a6e2-4ae1-b248-477f0856c038",
          "organization_name": "bb7YAC1EIk",
          "login_url": "https://staging-login.newrelic.com/logout?no_re=true&return_to=https%3A%2F%2Fstaging-login.newrelic.com%2Flogin%3Fauthentication_domain_id%3Dd491f710-cc5c-4961-91b1-a2f4892b935c%26email%3DPhdhyO4u%40oUDzpAQw.com",
          "user_id": 637090476
     }
*/
	 	const domain = data.user.possibleAuthDomains[0];
		Assert(typeof domain.authentication_domain_id === 'string', 'no authentication_domain_id, or wrong type');
		Assert.strictEqual(domain.authentication_domain_name, 'Default', 'authentication_domain_name should be "Default"');
		Assert.strictEqual(domain.authentication_type, 'password', 'authentication_type should be "password"');
		Assert(typeof domain.organization_id, 'no organization_id, or wrong type');
		Assert(typeof domain.organization_name === 'string', 'no organization_name, or wrong type');
		Assert(typeof domain.login_url === 'string', 'no login_url, or wrong type');
		Assert(typeof domain.user_id === 'number', 'no user_id, or wrong type');
	}
}

module.exports = PossibleAuthDomainsTest;
