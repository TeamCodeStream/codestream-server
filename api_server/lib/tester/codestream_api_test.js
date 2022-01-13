// Herein we define a base test for all CodeStream API Server Request tests

'use strict';

const ApiRequestTest = require('./api_request_test');
const CodeStreamApiTester = require('./codestream_api_tester');

// before the test is run, set up our CodeStream API Tester
const CodeStreamApiRequestBefore = async testRunner => {
	const testData = testRunner.getTestData();

	// inherit from the generic API Request Test
	await ApiRequestTest.before(testRunner);

	// if we don't have a a CodeStream API Tester already, instantiate one and cache it,
	// so all tests from here on in have access to it
	// the CodeStream API Tester manages running API Server Requests against a CodeStream
	// API Server, along with appropriate test setup and tear down as needed
	let codeStreamApiTester = testData.getCacheItem('codeStreamApiTester');
	if (!codeStreamApiTester) {
		codeStreamApiTester = new CodeStreamApiTester({
			testRunner
		});
		testData.setCacheItem('codeStreamApiTester', codeStreamApiTester);
	}

	// now run test setup 
	return codeStreamApiTester.before();
};

// run the current API Request test
const RunCodeStreamApiTest = async testRunner => {
	const testData = testRunner.getTestData();

	// get our CodeStream API Tester, and determine what access token we should pass in the request,
	// then actually run the test
	const codeStreamTester = testData.getCacheItem('codeStreamApiTester');
	testRunner.testOptions.token = codeStreamTester.getRequestToken();
	return ApiRequestTest.test(testRunner);
};

// after the test is run, do any cleanup or tear-down
const CodeStreamApiRequestAfter = async testRunner => {
	return ApiRequestTest.after(testRunner);
};

module.exports = {
	before: CodeStreamApiRequestBefore,
	test: RunCodeStreamApiTest,
	after: CodeStreamApiRequestAfter
};
