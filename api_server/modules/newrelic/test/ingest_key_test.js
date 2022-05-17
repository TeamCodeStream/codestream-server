// base class for all ingest key tests

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Assert = require('assert');

class IngestKeyTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should send the ingest key when requested with the proper secret';
	}
	
	get method () {
		return 'get';
	}

	get path () {
		return '/no-auth/nr-ingest-key';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions = this.apiRequestOptions || {};
			this.apiRequestOptions.headers = this.apiRequestOptions.headers || {};
			this.apiRequestOptions.headers = {
				'X-CS-Plugin-IDE': 'test'
			};
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		const { 
			browserIngestKey,
			licenseIngestKey,
			telemetryEndpoint,
			webviewAppId,
			webviewAgentId,
			accountNumber
		} = this.apiConfig.integrations.newrelic;
		const expectedResponse = { 
			browserIngestKey,
			licenseIngestKey,
			telemetryEndpoint,
			webviewAppId,
			webviewAgentId,
			accountId: accountNumber 
		};
		Assert.deepStrictEqual(data, expectedResponse, 'incorrect response');
	}
}

module.exports = IngestKeyTest;
