'use strict';

const VersionRequestTest = require('./version_request_test');

class IncompatibleVersionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'incompatible';
		this.pluginVersion = this.INCOMPATIBLE_RELEASE;
	}

	get description () {
		return 'should set version disposition to "incompatible" when an expired version of the IDE plugin is indicated with the request';
	}
}

module.exports = IncompatibleVersionRequestTest;