'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ReadPackageJson = require('read-package-json');
const Assert = require('assert');

class APIVersionTest extends CodeStreamAPITest {

	get description () {
		return 'should set X-CS-API-Version to the version indicated in package.json';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }

			// read in package.json so we can check if the version returned with the
			// test request matches
			ReadPackageJson(
				process.env.CS_API_TOP + '/package.json',
				(error, data) => {
					if (error) { return callback(error); }
					this.apiVersion = data.version;
					callback();
				}
			);
		});
	}

	// validate the response to the test request
	validateResponse () {
		Assert.equal(this.httpResponse.headers['x-cs-api-version'], this.apiVersion, 'API version is not correct');
	}
}

module.exports = APIVersionTest;
