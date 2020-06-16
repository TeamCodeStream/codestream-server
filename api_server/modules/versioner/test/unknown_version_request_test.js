'use strict';

const VersionRequestTest = require('./version_request_test');

class UnknownVersionRequestTest extends VersionRequestTest {

	constructor (options) {
		super(options);
		this.expectedDisposition = 'unknownVersion';
	}

	get description () {
		return 'should set version disposition to "unknownVersion" when an unknown plugin version is sent with the request';
	}

	// make the query data to be sent in the path
	makeQueryData () {
		// set the plugin version info to something unknown
		const queryData = super.makeQueryData();
		queryData.pluginVersion = this.UNKNOWN_RELEASE;
		return queryData;
	}

	// validate the version info concerning the agent that is returned with the response
	// to the test request
	validateAgentInfo () {
		// we don't expect any version info concerning the agent
	}
}

module.exports = UnknownVersionRequestTest;