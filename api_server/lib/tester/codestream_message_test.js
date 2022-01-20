// Herein we define a base test for all CodeStream API Server Request tests

'use strict';

const CodeStreamApiTest = require('./codestream_api_test');
const CodeStreamMessageTester = require('./codestream_message_tester');

// before the test is run, set up our CodeStream API test, and then set up the message test
const CodeStreamMessageTestBefore = async testRunner => {
	const testData = testRunner.getTestData();

	// inherit from the Api Test
	await CodeStreamApiTest.before(testRunner);

	// instantiate a CodeStream Message Tester and cache it for "anywhere" access
	// the CodeStream Message Tester manages running a single API Server Request 
	// against a CodeStream API Server, and then listens for broadcast messages
	// and validates them
	const codeStreamMessageTester = new CodeStreamMessageTester({
		testRunner
	});
	testData.setCacheItem('codeStreamMessageTester', codeStreamMessageTester);

	// run test setup for a message test, i.e., start listening
	await codeStreamMessageTester.before();
};

// run the current API Request test
const RunCodeStreamMessageTest = async testRunner => {
	// first run a standard API test
	await CodeStreamApiTest.test(testRunner);

	// now wait for the resulting message to come in
	const codeStreamMessageTester = testRunner.getTestData().getCacheItem('codeStreamMessageTester');
	return codeStreamMessageTester.test();
};

// after the test is run, do any cleanup or tear-down
const CodeStreamMessageTestAfter = async testRunner => {
	const codeStreamMessageTester = testRunner.getTestData().getCacheItem('codeStreamMessageTester');
	await codeStreamMessageTester.after();

	return CodeStreamApiTest.after(testRunner);
};

module.exports = {
	before: CodeStreamMessageTestBefore,
	test: RunCodeStreamMessageTest,
	after: CodeStreamMessageTestAfter
};
