'use strict';

const VersionerTest = require('./versioner_test');
const RandomString = require('randomstring');

class UnknownIDETest extends VersionerTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'unknownIDE';
	}

	get description () {
		return 'should set X-CS-Version-Disposition to "unknownIDE" when an unknown plugin IDE is sent with the request';
	}

	// before the test runs...
	before (callback) {
		// set the X-CS-Plugin-IDE header to something unknown
		super.before(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['x-cs-plugin-ide'] = `plugin-${RandomString.generate(12)}`;
			callback();
		});
	}

	// validate the version headers returned with the response to the test request
	validateVersionHeaders () {
		// we don't expect any version headers
	}

	// validate the version headers concerning the agent that are returned with the response
	// to the test request
	validateAgentHeaders () {
		// we don't expect any version headers concerning the agent
	}

	// validate the asset URL, which tells us where the latest extension lives
	// (this needs to be updated when we support multiple IDEs)
	validateAssetUrl () {
		// we don't expect the asset URL 
	}
}

module.exports = UnknownIDETest;