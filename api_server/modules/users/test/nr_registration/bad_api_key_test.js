'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class BadApiKeyTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when a bad api key is used';
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
			code: 'USRC-1027',
			message: 'Could not fetch required data from New Relic',
			reason: 'Bad API Key or no API Key provided'	// comes from New Relic
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data = {
				apiKey: 'dummy'
			};
			callback();
		});
	}
}

module.exports = BadApiKeyTest;
