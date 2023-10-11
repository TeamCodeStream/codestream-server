'use strict';

const InitialDataTest = require('./initial_data_test');
const Assert = require('assert');

class PossibleAuthDomainsTest extends InitialDataTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}

	get description () {
		return `user should receive possible auth domains when doing a raw login, under unified identity`;
	}

	// validate the response to the test request
	validateResponse (data) {
	 	const domain = data.user.possibleAuthDomains[0];
		Assert(typeof domain.authentication_domain_id === 'string', 'no authentication_domain_id, or wrong type');
		Assert.strictEqual(domain.authentication_domain_name, 'Default', 'authentication_domain_name should be "Default"');
		Assert.strictEqual(domain.authentication_type, 'password', 'authentication_type should be "password"');
		Assert(typeof domain.organization_id, 'no organization_id, or wrong type');
		Assert(typeof domain.organization_name === 'string', 'no organization_name, or wrong type');
		Assert(typeof domain.login_url === 'string', 'no login_url, or wrong type');
		Assert(typeof domain.user_id === 'number', 'no user_id, or wrong type');
		super.validateResponse(data);
	}
}

module.exports = PossibleAuthDomainsTest;
