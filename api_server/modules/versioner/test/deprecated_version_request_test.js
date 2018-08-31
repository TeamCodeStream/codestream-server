'use strict';

const VersionRequestTest = require('./version_request_test');

class DeprecatedVersionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'deprecated';
		this.pluginVersion = this.DEPRECATED_RELEASE;
	}

	get description () {
		return 'should set version disposition to "deprecated" when a deprecated version of the IDE plugin is indicated with the request';
	}
}

module.exports = DeprecatedVersionRequestTest;