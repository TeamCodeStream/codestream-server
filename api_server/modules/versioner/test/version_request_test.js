// base class for all version request tests

'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client.js');
const RandomString = require('randomstring');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class VersionRequestTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		
		// these constants will be used in setting up the fake version info, and also
		// for which value we use for the headers sent in the test request
		this.CURRENT_RELEASE = '2.3.5';
		this.EARLIEST_SUPPORTED_RELEASE = '2.0';
		this.MINUMUM_PREFERRED_RELEASE = '2.3';
		this.OUT_OF_DATE_RELEASE = '2.3.4';
		this.DEPRECATED_RELEASE = '2.2.1';
		this.INCOMPATIBLE_RELEASE = '1.7.9';
		this.UNKNOWN_RELEASE = '2.3.6';
		this.EARLIEST_SUPPORTED_AGENT = '3.3.0';
		this.PREFERRED_AGENT = '3.4.1';
		this.BAD_VERSION = '1@2@3';
		this.IMPROPER_VERSION = '2.3.5-';

		// the disposition we expect in the returned disposition header, override for various tests
		this.expectedDisposition = 'ok';

		// use this plugin version for the test, override for various tests
		this.pluginVersion = this.CURRENT_RELEASE;
	}

	// don't need an access token for the version request
	dontWantToken () {
		return true;
	}

	get description () {
		return 'should return version disposition of "ok" when the indicated version is current';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createVersionInfo
		], callback);
	}

	// create dummy version info for a fake IDE plugin, we'll use this info in issuing a 
	// request with the appropriate header info for the test
	createVersionInfo (callback) {
		// create a fake plugin name, and set up headers to be sent with the request
		this.pluginName = `plugin-${RandomString.generate(12)}`;
		const queryData = this.makeQueryData();
		this.path = '/no-auth/version?' + Object.keys(queryData).map(key => {
			return `${key}=${encodeURIComponent(queryData[key])}`;
		}).join('&');

		// set up version info to be associated with the plugin, 
		// we'll expect this info in the response
		const versionData = {
			clientType: this.pluginName,
			currentRelease: this.CURRENT_RELEASE,
			earliestSupportedRelease: this.EARLIEST_SUPPORTED_RELEASE,
			minimumPreferredRelease: this.MINUMUM_PREFERRED_RELEASE,
			[this.pluginVersion.replace(/\./g, '*')]: {
				earliestSupportedAgent: this.EARLIEST_SUPPORTED_AGENT,
				preferredAgent: this.PREFERRED_AGENT
			}
		};

		return this.sendMockVersionData(versionData, callback);
	}

	// send mock version matrix data to the api server
	sendMockVersionData (versionData, callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/--put-mock-version',
				data: versionData
			},
			callback
		);
	}

	// make the query data to be sent in the path
	makeQueryData () {
		return {
			pluginIDE: this.pluginName,
			pluginVersion: this.pluginVersion
		};
	}

	// validate the response to the test request
	validateResponse (data) {
		this.validateDisposition(data);
		this.validateVersionInfo(data);
		this.validateAgentInfo(data);
		this.validateAssetUrl(data);
	}

	// validate the version disposition returned with the response to the test request
	validateDisposition (data) {
		Assert.equal(data.versionDisposition, this.expectedDisposition, `version disposition should be "${this.expectedDisposition}", was "${data.versionDisposition}"`);
	}

	// validate the version info returned with the response to the test request
	validateVersionInfo (data) {
		Assert.equal(data.currentVersion, this.CURRENT_RELEASE, 'current version is not correct');
		Assert.equal(data.supportedVersion, this.EARLIEST_SUPPORTED_RELEASE, 'earliest supported version is not correct');
		Assert.equal(data.preferredVersion, this.MINUMUM_PREFERRED_RELEASE, 'preferred version is not correct');
	}

	// validate the version info concerning the agent that is returned with the response
	// to the test request
	validateAgentInfo (data) {
		Assert.equal(data.preferredAgent, this.PREFERRED_AGENT, 'preferred agent is not correct');
		Assert.equal(data.supportedAgent, this.EARLIEST_SUPPORTED_AGENT, 'supported agent is not correct');
	}

	// validate the asset URL, which tells us where the latest extension lives
	// (this needs to be updated when we support multiple IDEs)
	validateAssetUrl (data) {
		const assetEnv = this.apiConfig.api.assetEnvironment;
		const pluginName = this.pluginName.replace(/ /g, '').toLowerCase();
		Assert.equal(
			data.latestAssetUrl, 
			`https://assets.codestream.com/${assetEnv}/${pluginName}/codestream-latest.vsix`,
			'asset URL is not correct'
		);
	}
}

module.exports = VersionRequestTest;
