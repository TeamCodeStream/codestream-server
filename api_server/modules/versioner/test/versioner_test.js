// base class for all versioner tests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client.js');
const MongoConfig = require(process.env.CS_API_TOP + '/config/mongo');
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
		this.CURRENT_RELEASE = 'v2.3.5';
		this.EARLIEST_SUPPORTED_RELEASE = 'v2.0';
		this.MINUMUM_PREFERRED_RELEASE = 'v2.3';
		this.OUT_OF_DATE_RELEASE = 'v2.3.4';
		this.DEPRECATED_RELEASE = 'v2.2.1';
		this.INCOMPATIBLE_RELEASE = 'v1.7.9';
		this.UNKNOWN_RELEASE = 'v2.3.6';
		this.EARLIEST_SUPPORTED_AGENT = 'v3.3.0';
		this.PREFERRED_AGENT = 'v3.4.1';

		// the disposition we expect in the returned disposition header, override for various tests
		this.expectedDisposition = 'ok';

		// use this plugin version for the test, override for various tests
		this.pluginVersion = this.CURRENT_RELEASE;
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
			this.connectToMongo,
			this.createVersionInfo
		], callback);
	}

	// connect to mongo directly to create the fake plugin, along with version info
	async connectToMongo (callback) {
		// set up the mongo client, and open it against the versionMatrix collection
		this.mongoClientFactory = new MongoClient();
		const mongoConfig = Object.assign({}, MongoConfig, { collections: ['versionMatrix'] });
		delete mongoConfig.queryLogging;
		delete mongoConfig.hintsRequired;

		try {
			this.mongoClient = await this.mongoClientFactory.openMongoClient(mongoConfig);
		}
		catch (error) {
			return callback(error);
		}
		this.mongoData = this.mongoClient.mongoCollections;
		callback();
	}

	// create dummy version info for a fake IDE plugin, we'll use this info in issuing a 
	// request with the appropriate header info for the test
	async createVersionInfo (callback) {
		// create a fake plugin name, and set up headers to be sent with the request
		const pluginName = `plugin-${RandomString.generate(12)}`;
		this.apiRequestOptions = {
			headers: {
				'x-cs-plugin-ide': pluginName,
				'x-cs-plugin-version': this.pluginVersion
			}
		};

		// set up version info to be associated with the plugin, we'll expect this info in
		// the response
		const versionData = {
			clientType: pluginName,
			currentRelease: this.CURRENT_RELEASE,
			earliestSupportedRelease: this.EARLIEST_SUPPORTED_RELEASE,
			minimumPreferredRelease: this.MINUMUM_PREFERRED_RELEASE,
			[this.pluginVersion.replace(/\./g, '*')]: {
				earliestSupportedAgent: this.EARLIEST_SUPPORTED_AGENT,
				preferredAgent: this.PREFERRED_AGENT
			}
		};

		await this.mongoData.versionMatrix.create(versionData);
		callback();
	}

	// validate the response to the test request
	validateResponse () {
		this.validateDisposition();
		this.validateVersionHeaders();
		this.validateAgentHeaders();
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
}

module.exports = VersionerTest;
