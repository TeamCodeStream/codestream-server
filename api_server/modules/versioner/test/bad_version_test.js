'use strict';

const VersionerTest = require('./versioner_test');

class BadVersionTest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'unknownVersion';
		this.pluginVersion = this.BAD_VERSION;
	}

	get description () {
		return 'should set X-CS-Version-Disposition to "unknownVersion" when a bad version string is indicated with the request';
	}
}

module.exports = BadVersionTest;