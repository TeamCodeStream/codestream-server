// Herein we define the Test Runner, a class that manages running a given test, given test options
// This basically wraps mocha's non-class oriented functionality

'use strict';

const Assert = require('assert');

class TestRunner {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testOptions || {};
	}

	run () {
		try {
			const { before, test, after, descriptionHook } = this.testOptions;
			let { description } = this.testOptions;
			if (!description) { throw new Error('no description for test'); }

			// allow for description to be munged by the test
			if (descriptionHook) {
				description = descriptionHook(this, description);
			}

			// tests are run within the context of a suite, which manages data that persists between multiple tests
			// here we prefix the test description with an ordinal number, to ensure test descriptions are unique,
			// and help identify particular tests quickly
			const topSuite = this.topSuite();
			const testNum = topSuite && topSuite.nextTestNum();
			const testPrefix = testNum ? `${testNum}: ` : '';


			// run the actual test ... note that we choose NOT to use mocha's before and after functions, as
			// they are run in parallel before the tests in a given suite are run, and it is harder to identify
			// particular failures that way ... our test paradigm manages persistent data between tests, making
			// a before/after less necessary ... instead, the before/after is considered "part of the test run"
			const out = it(
				`${testPrefix}${description}`,
				async () => {
					try {
						if (before) await before(this);
					} catch (error) {
						console.error(`\x1b[31m${description || '???'}: Caught exception during test setup:`, error.message, error.stack);
						Assert.fail(error.message);
					}
					try {
						if (test) await test(this);
					} catch (error) {
						console.error(`\x1b[31m${description || '???'}: Caught exception running test:`, error.message, error.stack);
						Assert.fail(error.message);
					}
					try {
						if (after) await after(this);
					} catch (error) {
						console.error(`\x1b[31m${description || '???'}: Caught exception during test tear-down:`, error.message, error.stack);
						Assert.fail(error.message);
					}
				}
			);
			if (this.timeout) {
				out.timeout(this.timeout);
			}
		} catch (error) {
			console.warn(`\x1b[31mCAUGHT EXCEPTION:`, error.message, error.stack);
			Assert.fail(error.message);
		}
	}

	// get the immediate parent test suite for this test runner
	parentSuite () {
		return this.suite;
	}

	// get the top level test suite
	topSuite () {
		let suite = this.parentSuite();
		let nextSuite = suite;
		while (suite) {
			nextSuite = suite;
			suite = suite.parentSuite();
		}
		return nextSuite;
	}

	// log a message associated with this test, logs can be written at the end of a test run
	// to help diagnose problems that occurred during the test run
	testLog (msg) {
		const suite = this.topSuite();
		if (suite) {
			suite.testLog(msg);
		}
	}

	// return whether we are in "mock mode", which uses IPC-based communication for tests running locally,
	// which makes for a faster test run
	inMockMode () {
		const suite = this.topSuite();
		if (suite) {
			return suite.inMockMode();
		}
	}

	// get the master cache for this test run, managed by the top-level test suite
	getTestData () {
		const suite = this.topSuite();
		if (suite) {
			return suite.getTestData();
		} else {
			return {};
		}
	}

	// get the oridinal number assigned to this test, managed by the top-level test suite
	getTestNum () {
		const suite = this.topSuite();
		if (suite) {
			return suite.getTestNum();
		} else {
			return 1;
		}
	}
}

module.exports = TestRunner;
