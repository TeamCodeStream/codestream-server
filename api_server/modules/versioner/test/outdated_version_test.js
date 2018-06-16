'use strict';

const VersionerTest = require('./versioner_test');

class OutdatedVersionTest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'outdated';
		this.pluginVersion = this.OUT_OF_DATE_RELEASE;
	}

	get description () {
		return 'should set X-CS-Version-Disposition to "outdated" when an outdated but acceptable version of the IDE plugin is indicated with the request';
	}
}

module.exports = OutdatedVersionTest;