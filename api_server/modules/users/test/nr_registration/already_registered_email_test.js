'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class AlreadyRegisteredEmailTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when a user already exists with that email';
	}

	get method () {
		return 'post';
	}

	get path () {
		return '/no-auth/nr-register';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'USRC-1006',
			message: 'This user is already registered and confirmed'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				apiKey: 'dummy'
			};
			this.apiRequestOptions = {
				headers: {
					// TODO: use more appropriate secret
					'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
					'X-CS-Mock-Email': this.currentUser.user.email,
					'X-CS-Mock-Name': this.currentUser.user.fullName
				}
			};
			this.ignoreTokenOnRequest = true;
			callback();
		});
	}
}

module.exports = AlreadyRegisteredEmailTest;
