// base class for many tests of the "PUT /companies" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		this.expectedVersion = 2;
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCompanyData		// make the data to be used during the update
		], callback);
	}

	setTestOptions (callback) {
		this.teamOptions.createCompanyInstead = true;
		callback();
	}

	// form the data for the company update
	makeCompanyData (callback) {
		this.data = {
			name: this.companyFactory.randomName(),
			domainJoining: [this.companyFactory.randomDomain(), this.companyFactory.randomDomain()],
			codeHostJoining: [ `github.com/${RandomString.generate(12)}`, `gitlab.com/${RandomString.generate(12)}` ]
		};
		const domainJoiningLowerCase = this.data.domainJoining.map(domain => domain.toLowerCase());
		const codeHostJoiningLowerCase = this.data.codeHostJoining.map(host => host.toLowerCase());
		this.expectedData = {
			company: {
				_id: this.company.id,	// DEPRECATE ME
				id: this.company.id,
				$set: Object.assign(DeepClone(this.data), { 
					version: this.expectedVersion,
					modifiedAt: Date.now()	// placeholder
				}, {
					domainJoining: domainJoiningLowerCase,
					codeHostJoining: codeHostJoiningLowerCase
				}),
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

	// perform the actual company update 
	// the actual test is reading the company and verifying it is correct
	updateCompany (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/companies/' + this.company.id,
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
