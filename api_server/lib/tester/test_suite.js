// Herein we define a Test Suite, which manages the running of multiple tests
// Test suites can be nested: test suites can run other test suites, etc.
// But there is always a "top-level" test suite, which manages particular data that is
// persistent between tests

'use strict';

const TestRunner = require('./test_runner');
const TestData = require('./test_data');
const Strftime = require('strftime');

// make eslint happy
/* globals describe */

class TestSuite {

	constructor (options) {
		Object.assign(this, options);
		this.timeout = this.timeout || 5000;
		this.tests = this.tests || [];
		this.suites = this.suites || [];
		this.testNum = 0;
		this.testLogs = [];
		this.mockMode = false;
		this.testData = new TestData();
	}

	// run the test suite, a wrapper around mocha
	async run () {
		try {

			if (!this.description) { throw new Error('no description for test suite'); }

			const suite = describe(this.description, async () => {

				// run any sub-suites first...
				await Promise.all(this.suites.map(async suite => {
					await new TestSuite({
						...suite,
						suite: this
					}).run();
				}));

				// then run individual tests
				await Promise.all(this.tests.map(async test => {
					await new TestRunner({
						testOptions: this.deepClone(test),
						suite: this
					}).run();
				}));
			});

			if (this.timeout) {
				suite.timeout(this.timeout);
			}
		} catch (error) {
			console.warn('\x1b[31mTest suite caught:', error.message, error.stack);
		}
	}

	// get the parent suite to this test suite
	parentSuite () {
		return this.suite;
	}

	// get the current oridinal number assigned to a test, and increment the counter
	nextTestNum () {
		return ++this.testNum;
	}

	// get the current ordinal number assigned to a test, without incrementing the counter
	getTestNum () {
		return this.testNum;
	}

	// log messages for this test run, which can be output at the end of the test run for 
	// diagnosing problems
	testLog (msg) {
		const time = Strftime('%Y-%m-%d %H:%M:%S.%LZ', new Date());
		this.testLogs.push(`${time} ${msg}`);
	}

	// return whether we are in "mock mode", which uses IPC-based communication for tests running locally,
	// which makes for a faster test run
	inMockMode () {
		return this.mockMode;
	}

	// get the master cache associated with this test run
	getTestData () {
		return this.testData;
	}

	// deep clone utility
	deepClone (data) {
		return JSON.parse(JSON.stringify(data));
	}
}

module.exports = TestSuite;
