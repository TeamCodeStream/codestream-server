// base class for all versioner tests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client.js');
const RandomString = require('randomstring');
const Assert = require('assert');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

/*
CodeStreamAPITest handles setting up a user with a valid access token, and by default sends
the access token with the request ... we'll set up a fake IDE plugin along with version info
appropriate for the test, then each derived test class will test a possible outcome
*/

class VersionerTest extends CodeStreamAPITest {

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

		// minimal test setup ... just a registered user
		this.userOptions.numRegistered = 1;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should set X-CS-Version-Disposition to "ok" when the indicated version is current';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/users/me';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.connectToMongo,
			this.createVersionInfo
		], callback);
	}

	after (callback) {
		if (this.mongoClient) {
			this.mongoClient.close();
		}
		super.after(callback);
	}

	// connect to mongo directly to create the fake plugin, along with version info
	connectToMongo (callback) {
		if (this.mockMode) {
			return callback();	// not applicable in mock mode
		}

		// set up the mongo client, and open it against the versionMatrix collection
		this.mongoClientFactory = new MongoClient();
		const mongoConfig = Object.assign({}, this.apiConfig.mongo, { collections: ['versionMatrix'] });
		delete mongoConfig.queryLogging;
		delete mongoConfig.hintsRequired;

		(async () => {
			try {
				this.mongoClient = await this.mongoClientFactory.openMongoClient(mongoConfig);
			}
			catch (error) {
				return callback(error);
			}
			this.mongoData = this.mongoClient.mongoCollections;
			callback();
		})();
	}

	// create dummy version info for a fake IDE plugin, we'll use this info in issuing a 
	// request with the appropriate header info for the test
	createVersionInfo (callback) {
		// create a fake plugin name, and set up headers to be sent with the request
		this.pluginName = `plugin-${RandomString.generate(12)}`;
		this.apiRequestOptions = Object.assign({}, this.apiRequestOptions || {}, {
			headers: {
				'x-cs-plugin-ide': this.pluginName,
				'x-cs-plugin-version': this.pluginVersion
			}
		});

		// set up version info to be associated with the plugin, we'll expect this info in
		// the response
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

		(async () => {
			if (this.mockMode) {
				return this.sendMockVersionData(versionData, callback);
			}
			else {
				await this.mongoData.versionMatrix.create(versionData);
				callback();
			}
		})();
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

	// validate the response to the test request
	validateResponse () {
		this.validateDisposition();
		this.validateVersionHeaders();
		this.validateAgentHeaders();
		this.validateAssetUrl();
	}

	// validate the disposition header returned with the response to the test request
	validateDisposition () {
		Assert.equal(this.httpResponse.headers['x-cs-version-disposition'], this.expectedDisposition, 'version disposition is not correct');
	}

	// validate the version headers returned with the response to the test request
	validateVersionHeaders () {
		Assert.equal(this.httpResponse.headers['x-cs-current-version'], this.CURRENT_RELEASE, 'current version header is not correct');
		Assert.equal(this.httpResponse.headers['x-cs-supported-version'], this.EARLIEST_SUPPORTED_RELEASE, 'earliest supported version header is not correct');
		Assert.equal(this.httpResponse.headers['x-cs-preferred-version'], this.MINUMUM_PREFERRED_RELEASE, 'preferred version header is not correct');
	}

	// validate the version headers concerning the agent that are returned with the response
	// to the test request
	validateAgentHeaders () {
		Assert.equal(this.httpResponse.headers['x-cs-preferred-agent'], this.PREFERRED_AGENT, 'preferred agent header is not correct');
		Assert.equal(this.httpResponse.headers['x-cs-supported-agent'], this.EARLIEST_SUPPORTED_AGENT, 'supported agent header is not correct');
	}

	// validate the asset URL, which tells us where the latest extension lives
	// (this needs to be updated when we support multiple IDEs)
	validateAssetUrl () {
		const assetEnv = this.apiConfig.api.assetEnvironment;
		const pluginName = this.pluginName.replace(/ /g, '').toLowerCase();
		Assert.equal(
			this.httpResponse.headers['x-cs-latest-asset-url'], 
			`https://assets.codestream.com/${assetEnv}/${pluginName}/codestream-latest.vsix`,
			'asset URL is not correct'
		);
	}
}

module.exports = VersionerTest;
