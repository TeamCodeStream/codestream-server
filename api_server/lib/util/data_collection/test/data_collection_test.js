// base class for all DataCollection tests, we'll set up the mongo client here, plus provide a bunch
// of utility functions that other tests can share and run

'use strict';

const BaseTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/base_test');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client.js');
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const RandomString = require('randomstring');
const Assert = require('assert');
const DataCollection = require('../data_collection');
const DataModel = require('../data_model');

var CodeStreamApiConfig;
var ReusableMongoClient;

class DataCollectionTest extends BaseTest {

	// before the test runs...
	async before () {
		if (!CodeStreamApiConfig) {
			CodeStreamApiConfig = await ApiConfig.loadPreferredConfig();
		}
		this.apiConfig = CodeStreamApiConfig;

		// set up the mongo client, and open it against a test collection
		if (!ReusableMongoClient) {
			this.mongoClientFactory = new MongoClient({
				collections: ['test'],
				mockMode: this.mockMode
			});
			ReusableMongoClient = await this.mongoClientFactory.openMongoClient(this.apiConfig.mongo);
		}
		this.mongoClient = ReusableMongoClient;

		this.mongoData = this.mongoClient.mongoCollections;
		this.dataCollection = new DataCollection({
			databaseCollection: this.mongoData.test,
			modelClass: DataModel
		});
		this.data = { test: this.dataCollection };
	}

	async after () {
		if (this.mongoClient) {
			await this.mongoClient.close();
		}
	}

	// create a test model which we'll manipulate and a control model which we won't touch
	async createTestAndControlModel () {
		await super.before();
		await this.createTestModel();
		await this.createControlModel();
	}

	// create a simple test model with a variety of attributes to be used in various derived tests
	async createTestModel () {
		this.testModel = new DataModel({
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5],
			object: {
				x: 1,
				y: 2.1,
				z: 'three'
			}
		});

		const createdModel = await this.data.test.create(this.testModel.attributes);
		this.testModel.id = this.testModel.attributes.id = createdModel.id;
		this.testModel.attributes.version = 1;
	}

	// create a simple control model, distinct from the test model, we should never see this model again
	async createControlModel () {
		this.controlModel = new DataModel({
			text: 'goodbye',
			number: 54321,
			array: [5, 4, 3, 2, 1],
			object: {
				x: 3,
				y: 2.2,
				z: 'one'
			}
		});

		const createdModel = await this.data.test.create(this.controlModel.attributes);
		this.controlModel.id = this.controlModel.attributes.id = createdModel.id;
	}

	// for tests that test the caching ability, we want to ensure that a document has not yet
	// been persisted to the database, so try to fetch it from the database, which should
	// return nothing
	async confirmNotPersisted () {
		const response = await this.mongoData.test.getById(this.testModel.id);
		if (response !== null) {
			throw 'model that should have gone to cache seems to have persisted';
		}
	}

	// create a bunch of random models
	async createRandomModels () {
		this.models = new Array(10);
		// the randomizer ensures we don't pick up data that has been put in the database by other tests
		this.randomizer = RandomString.generate(20);
		for (let i = 0; i < 10; i++) {
			await this.createOneRandomModel(i);
		}
	}

	// with random models, we'll establish that we only want certain ones when
	// retrieving test results
	wantN (n) {
		// every odd-numbered model, plus the sixth one, should be a random enough pattern
		return n % 2 || n === 6;
	}

	// create a single random model, varying depending upon which model we are creating in order
	async createOneRandomModel (n) {
		let flag = this.randomizer + (this.wantN(n) ? 'yes' : 'no');	// tells us which ones we want in test results
		this.models[n] = new DataModel({
			text: 'hello' + n,
			number: n,
			flag: flag
		});

		const createdModel = await this.data.test.create(this.models[n].attributes);
		this.models[n].id = this.models[n].attributes.id = createdModel.id;
		this.models[n].attributes.version = 1;
	}

	// filter the test models down to only the ones we want in our test results
	async filterTestModels () {
		this.testModels = this.models.filter(model => {
			return this.wantN(model.get('number'));
		});
		// we'll also sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		this.testModels.sort((a, b) => {
			return a.get('number') - b.get('number');
		});
	}

	// do an established update of the test model
	async updateTestModel () {
		const update = {
			id: this.testModel.id,
			text: 'replaced!',
			number: 123
		};
		this.expectedOp = {
			$set: update
		};

		this.actualOp = await this.data.test.update(update);
		Object.assign(this.testModel.attributes, update);
	}

	// validate that we got back the model that exactly matches the test model
	validateModelResponse () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert(typeof this.response.attributes === 'object', 'improper fetched model');
		Assert.deepEqual(this.testModel.attributes, this.response.attributes, 'fetched model doesn\'t match');
		if (this.expectedOp) {
			Assert.deepEqual(this.actualOp, this.expectedOp, 'returned op is not correct');
		}
	}

	// validate that we got back an object (attributes of a model) that exactly matches the test model
	validateObjectResponse () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert.deepEqual(this.testModel.attributes, this.response, 'fetched object doesn\'t match');
	}

	// validate that we got back an array of objects that exactly match the array of test models
	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		let responseObjects = this.response.map(model => { return model.attributes; });
		let testObjects = this.testModels.map(model => { return model.attributes; });
		// sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		responseObjects.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(testObjects, responseObjects, 'fetched models don\'t match');
	}

	// persist whatever is in the cache to the database
	async persist () {
		return this.data.test.persist();
	}

	// clear the collection cache
	async clearCache () {
		this.data.test.clear();
	}
}

module.exports = DataCollectionTest;
