'use strict';

const Fetch = require('node-fetch');
const Assert = require('assert');
const { SlowBuffer } = require('buffer');

class ApiRequestTester {

	constructor (options) {
		Object.assign(this, options);
		this.testOptions = this.testRunner.testOptions;
	}

	async testApiRequest () {
		const { request, token } = this.testOptions;
		const { method, path, data, headers } = request;
		const result = await this.apiRequester.sendApiRequest({
			method,
			path,
			data,
			headers,
			bearerToken: token
		});
		await this.validateResult(result);
	}

	async validateResult (result) {
		const { status } = result;
		const { 
			expectedStatus = this.testOptions.expectedError ? 403 : 200
		} = this.testOptions;
		Assert.strictEqual(status, expectedStatus, `invalid status code returned by test request: ${status}`);
		if (this.testOptions.expectedError) {
			return this.validateErrorResult(result);
		} else {
			return this.validateOkResult(result);
		}
	}

	async validateErrorResult (result) {
		const { responseData } = result;
		const { expectedError } = this.testOptions;
		if (expectedError) {
			Assert.deepStrictEqual(responseData, expectedError, 'error data not correct');
		}
	}

	async validateOkResult (result) {
		const { responseData } = result;
		return this.validateResponseData(responseData);
	}

	async validateResponseData (responseData) {
		let expectedResponse;
		if (this.testOptions.expectedResponse) {
			expectedResponse = this.evalExpectedResponse(this.testOptions.expectedResponse);
		}
		if (expectedResponse) {
			Assert.deepStrictEqual(responseData, expectedResponse, 'response data not correct');
		}
	}
}

module.exports = ApiRequestTester;


