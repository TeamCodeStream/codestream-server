'use strict';

const VersionerTest = require('./versioner_test');
const Assert = require('assert');

class IncompatibleVersionTest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'incompatible';
		this.pluginVersion = this.INCOMPATIBLE_RELEASE;
		this.apiRequestOptions = {
			noJsonInResponse: true
		};
	}

	get description () {
		return 'should return an error and set X-CS-Version-Disposition to "incompatible" when an expired version of the IDE plugin is indicated with the request';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, '', 'empty response should be returned');
		Assert.equal(this.httpResponse.statusCode, 204, 'status code should be 204');
		this.validateDisposition();
		[
			'x-cs-current-version',
			'x-cs-supported-version',
			'x-cs-preferred-version',
			'x-cs-preferred-agent',
			'x-cs-supported-agent'
		].forEach(header => {
			Assert(typeof this.httpResponse.headers[header] === 'undefined', `header ${header} should not have been returned`);
		});
	}
}

module.exports = IncompatibleVersionTest;