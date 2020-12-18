// base class for many tests of the "PUT /company-test-group/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		this.teamOptions.creatorIndex = 1;
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.setTestData
		], callback);
	}

	setTestData (callback) {
		this.data = {
			'test1': 'A',
			'test2': 'C'
		};
		this.expectedData = {
			company: {
				_id: this.company.id,	// DEPRECATE ME
				id: this.company.id,
				$set: {
					'testGroups.test1': 'A',
					'testGroups.test2': 'C',
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}
		};
		this.path = '/company-test-group/' + this.company.id;
		this.expectedCompany = Object.assign({}, this.company, { testGroups: this.data });
		this.expectedCompany.version = 2;
		this.updatedAt = Date.now();
		callback();
	}

	// actually setting the data
	setCompanyTestGroups (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/company-test-group/' + this.company.id,
				token: this.token
			},
			callback
		);
	}
}

module.exports = CommonInit;
