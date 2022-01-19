// Herein we define an API Request Tester class
// This class manages running API Server Tests, and validating results
// This class should be considered "generic" and should not contain anything specific to CodeStream testing

'use strict';

const Assert = require('assert');

class ApiRequestTester {

	constructor (options) {
		// the "test runner" is the thing that is running the test, it has test options which define the test
		Object.assign(this, options);
		this.testOptions = this.testRunner.testOptions;
	}

	// set a "response validator" ... a callback which will validate the actual response of the test request,
	// against an expected response
	setResponseValidator (fn, errorFn = null) {
		this.responseValidator = fn;
		this.errorResponseValidator = errorFn;
	}

	// test the current test as defined by the testOptions passed in in the constructor
	async testApiRequest () {
		const { request, token, requestDataHook } = this.testOptions;
		const { method, path, headers } = request;
		let { data } = request;
		if (data) {
			data = this.deepClone(data);
		}

		// if a request data hook function is supplied in test options, call it now to munge the request data
		if (requestDataHook) {
			await requestDataHook(this.testRunner, data);
		}

		// send the API request, and get the result
		const result = await this.apiRequester.sendApiRequest({
			method,
			path,
			data,
			headers,
			bearerToken: token
		});

		// validate the result of the test
		await this.validateResult(result);
	}

	// validate the result of an API Server Test, according to current test options
	async validateResult (result) {
		// by default, we expect a status code of 200 for successful requests, and a 403 for unsuccessul
		// (these can, of course, be overridden for particular tests)
		const { status } = result;
		const { 
			expectedStatus = this.testOptions.expectedError ? 403 : 200
		} = this.testOptions;
		Assert.strictEqual(status, expectedStatus, `invalid status code returned by test request: ${status}`);

		// validate the actual response according to whether we expected an error response or an ok response
		if (this.testOptions.expectedError) {
			return this.validateErrorResult(result);
		} else {
			return this.validateOkResult(result);
		}
	}

	// validate that a result matches an expected error result
	async validateErrorResult (result) {
		const { responseData } = result;
		const { expectedError } = this.testOptions;
		if (expectedError) {
			if (this.errorResponseValidator) {
				await this.errorResponseValidator(responseData, expectedError);
			} else {
				Assert.deepStrictEqual(responseData, expectedError, 'error data not correct');
			}
		}
	}

	// validate that a result matches an expected (successful) results
	async validateOkResult (result) {
		const { responseData } = result;
		return this.validateResponseData(responseData);
	}

	// validate that the response to the test request matches the expected response
	async validateResponseData (responseData) {
		if (this.testOptions.expectedResponse) {
			let expectedResponse = this.testOptions.expectedResponse;
			if (this.responseValidator) {
				await this.responseValidator(responseData, expectedResponse);
			} else {
				Assert.deepStrictEqual(responseData, expectedResponse, 'response data not correct');
			}
		}
	}
	
	// deep clone utility
	deepClone (data) {
		return JSON.parse(JSON.stringify(data));
	}
}

module.exports = ApiRequestTester;


