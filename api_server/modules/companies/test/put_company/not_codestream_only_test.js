'use strict';

const PutCompanyTest = require('./put_company_test');
const RandomString = require('randomstring');

class NotCodeStreamOnlyTest extends PutCompanyTest {

	get description () {
		return 'should return an error when trying to update a company that is not codestream-only';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'this company/org is managed by New Relic and can not be updated'
		};
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.makeOrgNotCodeStreamOnly(callback);
		});
	}

	makeOrgNotCodeStreamOnly (callback) {
		// we make the org not codestream-only by performing an update operation
		// on the company, forcing a check against the linked NR org, but for
		// test purposes this will be a mock response
		this.doApiRequest(
			{
				method: 'put',
				path: '/companies/' + this.company.id,
				data: {
					name: RandomString.generate(10)
				},
				token: this.token,
				requestOptions: {
					headers: {
						'x-cs-mock-no-cs-only': true
					}
				}
			},
			error => {
				// we actually expect this to fail, as this operation is forbidden
				// when we find, through New Relic, that the org is not codestream-only anymore
				if (error) {
					return callback();
				} else {
					throw new Error('error not returned to PUT /companies when triggering not CS-only');
				}
			}
		);
	}
}

module.exports = NotCodeStreamOnlyTest;
