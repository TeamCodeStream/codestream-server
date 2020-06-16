'use strict';

const VersionRequestTest = require('./version_request_test');

class ImproperVersionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'ok';
		this.pluginVersion = this.IMPROPER_VERSION;
	}

	get description () {
		return 'should set version to "ok" when a version string is indicated with the request that is not proper but can still be normalized';
	}
}

module.exports = ImproperVersionRequestTest;