'use strict';

const VersionRequestTest = require('./version_request_test');

class UnknownDispositionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'unknown';
	}

	get description () {
		return 'should set version disposition to "unknown" when no plugin IDE is sent with the request';
	}

	// make the query data to be sent in the path
	makeQueryData () {
		// delete the plugin IDE from the request
		const queryData = super.makeQueryData();
		delete queryData.pluginIDE;
		return queryData;
	}

	// validate the version info returned with the response to the test request
	validateVersionInfo () {
		// we don't expect any version info
	}

	// validate the version info concerning the agent that is returned with the response
	// to the test request
	validateAgentInfo () {
		// we don't expect any version info concerning the agent
	}

	// validate the asset URL, which tells us where the latest extension lives
	// (this needs to be updated when we support multiple IDEs)
	validateAssetUrl () {
		// we don't expect the asset URL 
	}
}

module.exports = UnknownDispositionRequestTest;