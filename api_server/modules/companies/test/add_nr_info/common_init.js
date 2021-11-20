// base class for many tests of the "POST /companies/add-nr-info/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

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
			accountIds: [
				this.codeErrorFactory.randomAccountId(),
				this.codeErrorFactory.randomAccountId(),
				this.codeErrorFactory.randomAccountId()
			],
			orgIds: [
				this.codeErrorFactory.randomOrgId(),
				this.codeErrorFactory.randomOrgId(),
				this.codeErrorFactory.randomOrgId()
			]
		};
		this.expectedData = {
			company: {
				_id: this.company.id,	// DEPRECATE ME
				id: this.company.id,
				$addToSet: {
					nrAccountIds: this.data.accountIds,
					nrOrgIds: this.data.orgIds
				},
				$set: {
					modifiedAt: Date.now(), // placeholder
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}
		};
		this.path = '/companies/add-nr-info/' + this.company.id;
		this.expectedCompany = Object.assign({}, this.company, {
			nrAccountIds: this.data.accountIds,
			nrOrgIds: this.data.orgIds
		});
		this.expectedCompany.version = 2;
		this.updatedAt = Date.now();
		callback();
	}

	// actually setting the data
	addNRInfo (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies/add-nr-info/' + this.company.id,
				data: this.data,
				token: this.token
			},
			callback
		);
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
			if (this.expectedCompany.nrAccountIds) {
				this.expectedCompany.nrAccountIds.sort();
				response.company.nrAccountIds.sort();
			}
			if (this.expectedCompany.nrOrgIds) {
				this.expectedCompany.nrOrgIds.sort();
				response.company.nrOrgIds.sort();
			}
			Assert.deepStrictEqual(response.company, this.expectedCompany);
			callback();
		});
	}
}

module.exports = CommonInit;
