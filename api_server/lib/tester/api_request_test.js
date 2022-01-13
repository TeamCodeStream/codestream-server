'use strict';

const ApiRequestTester = require('./api_request_tester');
const ApiRequester = require('./api_requester');

const ApiRequestTestBefore = async testRunner => {
	const apiRequester = new ApiRequester();
	const tester = new ApiRequestTester({
		testRunner,
		apiRequester
	});
	const testData = testRunner.getTestData();
	testData.setCacheItem('apiRequestTester', tester);
	testData.setCacheItem('apiRequester', apiRequester);
};

const RunApiRequestTest = async testRunner => {
	return testRunner.getTestData().getCacheItem('apiRequestTester').testApiRequest(testRunner);
};

const ApiRequestTestAfter = async testRunner => {
};

module.exports = {
	before: ApiRequestTestBefore,
	test: RunApiRequestTest,
	after: ApiRequestTestAfter
};

