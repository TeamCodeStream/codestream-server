'use strict';

const CompanyTestGroupTest = require('./company_test_group_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class FetchTest extends CompanyTestGroupTest {

	get description () {
		return 'should set a company test group settings when requested, checked by fetching the company';
	}

	// run the actual test...
	run (callback) {
		// we'll run the update, but also verify the update took by fetching and validating
		// the company object
		BoundAsync.series(this, [
			super.run,
			this.validateCompanyObject
		], callback);
	}

	// fetch and validate the company object against the update we made
	validateCompanyObject (callback) {
		this.doApiRequest({
			method: 'get',
			path: '/companies/' + this.company.id,
			token: this.token
		}, (error, response) => {
			if (error) { return callback(error); }
			Assert(response.company.modifiedAt >= this.updatedAt, 'modifiedAt for company not updated');
			this.expectedCompany.modifiedAt = response.company.modifiedAt;
			Assert.deepStrictEqual(response.company, this.expectedCompany);
			callback();
		});
	}
}

module.exports = FetchTest;
