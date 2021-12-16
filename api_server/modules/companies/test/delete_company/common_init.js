// base class for many tests of the "DELETE /companies/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCompanyData
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.createCompanyInstead = true;
		this.expectedVersion = 2;
		callback();
	}

	// form the data for the company deactivation
	makeCompanyData (callback) {
		this.expectedData = {
			company: {
				_id: this.company.id,	// DEPRECATE ME
				id: this.company.id,
				$set: {
					version: this.expectedVersion,
					deactivated: true,
					modifiedAt: Date.now(),	// placeholder
					name: this.company.name	// placeholder
				},
				$version: {
					before: this.expectedVersion - 1,
					after: this.expectedVersion
				}
			}
		};
		this.expectedCompany = DeepClone(this.company);
		Object.assign(this.expectedCompany, this.expectedData.company.$set);
		this.path = '/companies/' + this.company.id;
		this.modifiedAfter = Date.now();
		callback();
	}

	deleteCompany (callback) {
		this.doApiRequest(
			{
				method: 'delete',
				path: '/companies/' + this.company.id,
				data: null,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = {
					companies: [response.company]
				};
				callback();
			}
		);
	}
}

module.exports = CommonInit;