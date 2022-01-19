// Herein we define a base test for all CodeStream API Server Request tests

'use strict';

const ApiRequestTest = require('./api_request_test');
const CodeStreamApiTester = require('./codestream_api_tester');

// before the test is run, set up our CodeStream API Tester
const CodeStreamApiTestBefore = async testRunner => {
	const testData = testRunner.getTestData();

	// inherit from the generic API Request Test
	await ApiRequestTest.before(testRunner);

	// instantiate a CodeStream API Tester and cache it for "anywhere" access
	// the CodeStream API Tester manages running a single API Server Request 
	// against a CodeStream API Server, along with appropriate test setup and tear down as needed
	const codeStreamApiTester = new CodeStreamApiTester({
		testRunner
	});
	testData.setCacheItem('codeStreamApiTester', codeStreamApiTester);

	// set the "response validator" for the API Request Tester ... this will be used to
	// validate the response to the test request
	let apiRequestTester = testData.getCacheItem('apiRequestTester');
	apiRequestTester.setResponseValidator(
		codeStreamApiTester.validateResponseData.bind(codeStreamApiTester),
		codeStreamApiTester.validateErrorResponseData.bind(codeStreamApiTester)
	);

	// run test setup 
	await codeStreamApiTester.before();

	// determine what access token we should pass in the request
	testRunner.testOptions.token = codeStreamApiTester.getRequestToken();
	testRunner.testOptions.testStartedAt = Date.now();
};

// run the current API Request test
const RunCodeStreamApiTest = async testRunner => {
	return ApiRequestTest.test(testRunner);
};

// after the test is run, do any cleanup or tear-down
const CodeStreamApiTestAfter = async testRunner => {
	return ApiRequestTest.after(testRunner);
};

module.exports = {
	before: CodeStreamApiTestBefore,
	test: RunCodeStreamApiTest,
	after: CodeStreamApiTestAfter
};
