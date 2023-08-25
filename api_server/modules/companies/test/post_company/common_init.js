// base class for many tests of the "POST /companies" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeCompanyData
		], callback);
	}

	// make the data to use when issuing the request
	makeCompanyData (callback) {
		this.data = {
			name: this.companyFactory.randomName()
		};
		this.path = '/companies';
		callback();
	}

	// perform the actual company creation 
	createCompany (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/companies',
				data: this.data,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.createCompanyResponse = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
