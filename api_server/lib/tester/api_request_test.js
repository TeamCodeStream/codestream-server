// Herein we define a base test for all API Server Request tests

'use strict';

const ApiRequestTester = require('./api_request_tester');
const ApiRequester = require('./api_requester');

// before the test is run, set up our API Requester and API Request Tester
const ApiRequestTestBefore = async testRunner => {
	const testData = testRunner.getTestData();

	// if we don't have an API Requester already, instantiate one and cache it,
	// so all tests from here on in have access to it
	// the API Requester manages actually sending API Requests to the API Server
	let apiRequester = testData.getCacheItem('apiRequester');
	if (!apiRequester) {
		apiRequester = new ApiRequester();
		testData.setCacheItem('apiRequester', apiRequester);
	}

	// instantiate an API Request Tester and cache it for "anywhere" access
	// the API Request Tester manages running a single API Server Request and validating the results
	const apiRequestTester = new ApiRequestTester({
		testRunner,
		apiRequester
	});
	testData.setCacheItem('apiRequestTester', apiRequestTester);
};

// run the current API Request test
const RunApiRequestTest = async testRunner => {
	// retrieve the API Request Tester from the test cache, and test the current request
	return testRunner.getTestData().getCacheItem('apiRequestTester').testApiRequest(testRunner);
};

// after the test is run, do any cleanup or tear-down
const ApiRequestTestAfter = async testRunner => {
};

module.exports = {
	before: ApiRequestTestBefore,
	test: RunApiRequestTest,
	after: ApiRequestTestAfter
};

