'use strict';

const Assert = require('assert');

class TestRunner {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testOptions || {};
	}

	run () {
		try {
			const { description } = this.testOptions;
			if (!description) { throw new Error('no description for test'); }

			const topSuite = this.topSuite();
			const testNum = topSuite && topSuite.nextTestNum();
			const testPrefix = testNum ? `${testNum}: ` : '';
			const { before, test, after } = this.testOptions;
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

	parentSuite () {
		return this.suite;
	}

	topSuite () {
		let suite = this.parentSuite();
		let nextSuite = suite;
		while (suite) {
			nextSuite = suite;
			suite = suite.parentSuite();
		}
		return nextSuite;
	}

	testLog (msg) {
		const suite = this.topSuite();
		if (suite) {
			suite.testLog(msg);
		}
	}

	inMockMode () {
		const suite = this.topSuite();
		if (suite) {
			return suite.inMockMode();
		}
	}

	getTestData () {
		const suite = this.topSuite();
		if (suite) {
			return suite.getTestData();
		} else {
			return {};
		}
	}

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
