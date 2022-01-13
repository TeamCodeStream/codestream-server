'use strict';

const ApiRequestTest = require('./api_request_test');
const CodeStreamApiTester = require('./codestream_api_tester');

const CodeStreamApiRequestBefore = async testRunner => {
	await ApiRequestTest.before(testRunner);
	const tester = new CodeStreamApiTester({ testRunner });
	const testData = testRunner.getTestData();
	testData.setCacheItem('codeStreamTester', tester);

	return tester.before();
};

const RunCodeStreamApiTest = async testRunner => {
	const testData = testRunner.getTestData();
	const codeStreamTester = testData.getCacheItem('codeStreamTester');
	testRunner.testOptions.token = codeStreamTester.getRequestToken();
	return ApiRequestTest.test(testRunner);
};

const CodeStreamApiRequestAfter = async testRunner => {
	return ApiRequestTest.after(testRunner);
};

module.exports = {
	before: CodeStreamApiRequestBefore,
	test: RunCodeStreamApiTest,
	after: CodeStreamApiRequestAfter
};
