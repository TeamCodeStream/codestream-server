'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');
const Assert = require('assert');
const Crypto = require('crypto');

class GitLensUserTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should be able to create a GitLens user';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/gitlens-user';
	}

	hash (s) {
		return Crypto.createHash('sha1').update(`gitlens:${s.trim().toLowerCase()}`).digest('hex').toLowerCase();
	}

	// before the test runs...
	before (callback) {
		super.before(async error => {
			if (error) { return callback(error); }
			const email = this.userFactory.randomEmail();
			const emailHash = this.hash(email);	
			const machineId = RandomString.generate(12);
			const machineIdHash = this.hash(machineId);
			this.data = { emailHash, machineIdHash };
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'empty object not returned');
	}
}

module.exports = GitLensUserTest;
