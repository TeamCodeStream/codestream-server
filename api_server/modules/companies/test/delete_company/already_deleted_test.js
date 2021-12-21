'use strict';

const DeleteCompanyTest = require('./delete_company_test');

class AlreadyDeletedTest extends DeleteCompanyTest {

	get description () {
		return 'should return an error when trying to delete a company that has already been deleted';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1014'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// delete the company, ahead of time...
			this.doApiRequest(
				{
					method: 'delete',
					path: '/companies/' + this.company.id,
					token: this.token
				},
				callback
			);
		});
	}
}

module.exports = AlreadyDeletedTest;