'use strict';

const GetCompaniesTest = require('./get_companies_test');

class IDsRequiredTest extends GetCompaniesTest {

	get description () {
		return 'should return error if IDs are not provided to companies query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'ids'
		};
	}

	// can't just GET /companies, need to specify IDs or "mine"
	setPath (callback) {
		this.path = '/companies';
		callback();
	}
}

module.exports = IDsRequiredTest;
