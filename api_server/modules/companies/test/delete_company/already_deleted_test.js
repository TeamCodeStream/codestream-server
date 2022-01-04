'use strict';

const DeleteCompanyTest = require('./delete_company_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class AlreadyDeletedTest extends DeleteCompanyTest {

	get description () {
		return 'should return an error when trying to delete a company that has already been deleted';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'company'
		};
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.deleteCompany
		], callback);
	}
}

module.exports = AlreadyDeletedTest;