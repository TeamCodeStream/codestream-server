'use strict';

const VersionRequestTest = require('./version_request_test');

class BadVersionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'unknownVersion';
		this.pluginVersion = this.BAD_VERSION;
	}

	get description () {
		return 'should set version disposition to "unknownVersion" when a bad version string is indicated with the request';
	}
}

module.exports = BadVersionRequestTest;