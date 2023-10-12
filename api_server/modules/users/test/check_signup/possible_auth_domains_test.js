'use strict';

const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');
const Assert = require('assert');

class PossibleAuthDomainsTest extends EligibleJoinCompaniesTest {

	constructor (options) {
		super(options);
		this.unifiedIdentityEnabled = true;
	}

	get description () {
		return `user should receive possible auth domains with response to check signup, under unified identity`;
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.userOptions.numRegistered = 2;
			this.teamOptions.creatorIndex = 1;
			callback();
		});
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
	}
}

module.exports = PossibleAuthDomainsTest;
