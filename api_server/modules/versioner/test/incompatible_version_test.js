'use strict';

const VersionerTest = require('./versioner_test');
const Assert = require('assert');

class IncompatibleVersionTest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'incompatible';
		this.pluginVersion = this.INCOMPATIBLE_RELEASE;
	}

	get description () {
		return 'should return an error and set X-CS-Version-Disposition to "incompatible" when an expired version of the IDE plugin is indicated with the request';
	}

	getExpectedError () {
		return {
			code: 'VERS-1001'
		};
	}

	// run the actual test...
	run (callback) {
		// even though we're expecting an error, we'll still validate the returned headers
		super.run(error => {
			if (error) { return callback(error); }
			this.validateResponse();
			callback();
		});
	}

	// validate the response to the test request
	validateResponse () {
		Assert.equal(this.httpResponse.statusCode, 400, 'status code should be 400');
		this.validateDisposition();
		this.validateAssetUrl();
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