'use strict';

const VersionerTest = require('./versioner_test');

class ImproperVersionTest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'ok';
		this.pluginVersion = this.IMPROPER_VERSION;
	}

	get description () {
		return 'should set X-CS-Version-Disposition to "ok" when a version string is indicated with the request that is not proper but can still be normalized';
	}
}

module.exports = ImproperVersionTest;