'use strict';

const VersionRequestTest = require('./version_request_test');

class OutdatedVersionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'outdated';
		this.pluginVersion = this.OUT_OF_DATE_RELEASE;
	}

	get description () {
		return 'should set version disposition to "outdated" when an outdated but acceptable version of the IDE plugin is indicated with the request';
	}
}

module.exports = OutdatedVersionRequestTest;