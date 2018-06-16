'use strict';

const VersionerTest = require('./versioner_test');

class DeprecatedVersionTest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'deprecated';
		this.pluginVersion = this.DEPRECATED_RELEASE;
	}

	get description () {
		return 'should set X-CS-Version-Disposition to "deprecated" when a deprecated version of the IDE plugin is indicated with the request';
	}
}

module.exports = DeprecatedVersionTest;