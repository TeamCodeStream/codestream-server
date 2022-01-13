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
		this.inited = false;
		this.finalized = false;
		this.testLogs = [];
		this.mockMode = false;
		this.testData = new TestData();
	}

	async run () {
		try {

			if (!this.inited) {
				await this.init();
			}
			if (!this.description) { throw new Error('no description for test suite'); }

			const suite = describe(this.description, async () => {
				await Promise.all(this.suites.map(async suite => {
					await new TestSuite({
						...suite,
						suite: this
					}).run();
				}));

				await Promise.all(this.tests.map(async test => {
					await new TestRunner({
						testOptions: test,
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

	parentSuite () {
		return this.suite;
	}

	nextTestNum () {
		return ++this.testNum;
	}

	getTestNum () {
		return this.testNum;
	}

	async init () {
		this.inited = true;
	}

	async final () {
		this.finalized = true;
	}

	testLog (msg) {
		const time = Strftime('%Y-%m-%d %H:%M:%S.%LZ', new Date());
		this.testLogs.push(`${time} ${msg}`);
	}

	inMockMode () {
		return this.mockMode;
	}

	getTestData () {
		return this.testData;
	}
}

module.exports = TestSuite;
