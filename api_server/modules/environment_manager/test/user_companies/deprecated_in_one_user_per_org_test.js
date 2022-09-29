'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class DeprecatedInOneUserPerOrgTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.oneUserPerOrg = true;
	}

	get description () {
		return 'should return an error indicating request is deprecated when making a request to fetch companies the user is a member of across environments';
	}

	get method () {
		return 'get';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1016'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/xenv/user-companies?email=' + encodeURIComponent(this.currentUser.user.email);
			this.apiRequestOptions = {
				headers: {
					'X-CS-Auth-Secret': this.apiConfig.environmentGroupSecrets.requestAuth
				}
			};
			callback();
		});
	}
}

module.exports = DeprecatedInOneUserPerOrgTest;
