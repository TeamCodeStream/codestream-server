'use strict';

const PostCompanyTest = require('./post_company_test');
const RandomString = require('randomstring');
const Assert = require('assert');

class JoiningTest extends PostCompanyTest {

	get description () {
		return 'should be able to attach join settings to allow domain and cost host based joining when creating a company';
	}

	// make the data to use when issuing the request
	makeCompanyData (callback) {
		super.makeCompanyData(() => {
			this.data.domainJoining = [this.companyFactory.randomDomain(), this.companyFactory.randomDomain()];
			this.data.codeHostJoining = [ `github.com/${RandomString.generate(12)}`, `gitlab.com/${RandomString.generate(12)}` ];
			callback();
		});
	}

	/* eslint complexity: 0 */
	// validate the response to the test request
	validateResponse (data) {
		const { company } = data;
		if (this.data.domainJoining) {
			const domainJoining = this.data.domainJoining.map(s => s.toLowerCase());
			Assert.deepStrictEqual(company.domainJoining, domainJoining, 'domainJoining does not match');
		}
		if (this.data.codeHostJoining) {
			const codeHostJoining = this.data.codeHostJoining.map(s => s.toLowerCase());
			Assert.deepStrictEqual(company.codeHostJoining, codeHostJoining, 'codeHostJoining does not match');
		}
		return super.validateResponse(data);
	}
}

module.exports = JoiningTest;
