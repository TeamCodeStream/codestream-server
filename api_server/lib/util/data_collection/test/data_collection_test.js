// base class for all DataCollection tests, we'll set up the mongo client here, plus provide a bunch
// of utility functions that other tests can share and run

'use strict';

var GenericTest = require(process.env.CS_API_TOP + '/lib/test_base/generic_test');
var MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client.js');
var TestAPIConfig = require(process.env.CS_API_TOP + '/config/api_test');
var RandomString = require('randomstring');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Assert = require('assert');
var DataCollection = require('../data_collection');
var DataModel = require('../data_model');

class DataCollectionTest extends GenericTest {

	// before the test runs...
	before (callback) {
		// set up the mongo client, and open it against a test collection
		this.mongoClientFactory = new MongoClient();
		const mongoConfig = Object.assign({}, TestAPIConfig.mongo, { collections: ['test'] });
		this.mongoClientFactory.openMongoClient(
			mongoConfig,
			(error, mongoClient) => {
				if (error) { return callback(error); }
				this.mongoClient = mongoClient;
				this.mongoData = this.mongoClient.mongoCollections;
				this.dataCollection = new DataCollection({
					databaseCollection: this.mongoData.test,
					modelClass: DataModel
				});
				this.data = { test: this.dataCollection };
				callback();
			}
		);
	}

	// create a test model which we'll manipulate and a control model which we won't touch
	createTestAndControlModel (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestModel,
			this.createControlModel
		], callback);
	}

	// create a simple test model with a variety of attributes to be used in various derived tests
	createTestModel (callback) {
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
		this.data.test.create(
			this.testModel.attributes,
			(error, createdModel) => {
				if (error) { return callback(error); }
				this.testModel.id = this.testModel.attributes._id = createdModel.id;
				callback();
			}
		);
	}

	// create a simple control model, distinct from the test model, we should never see this model again
	createControlModel (callback) {
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
		this.data.test.create(
			this.controlModel.attributes,
			(error, createdModel) => {
				if (error) { return callback(error); }
				this.controlModel.id = this.controlModel.attributes._id = createdModel.id;
				callback();
			}
		);
	}

	// for tests that test the caching ability, we want to ensure that a document has not yet
	// been persisted to the database, so try to fetch it from the database, which should
	// return nothing
	confirmNotPersisted (callback) {
		this.mongoData.test.getById(
			this.testModel.id,
			(error, response) => {
				if (error) { return callback(error); }
				if (response !== null) {
					return callback('model that should have gone to cache seems to have persisted');
				}
				callback();
			}
		);
	}

	// create a bunch of random models
	createRandomModels (callback) {
		this.models = new Array(10);
		// the randomizer ensures we don't pick up data that has been put in the database by other tests
		this.randomizer = RandomString.generate(20);
		BoundAsync.times(
			this,
			10,
			this.createOneRandomModel,
			callback
		);
	}

	// with random models, we'll establish that we only want certain ones when
	// retrieving test results
	wantN (n) {
		// every odd-numbered model, plus the sixth one, should be a random enough pattern
		return n % 2 || n === 6;
	}

	// create a single random model, varying depending upon which model we are creating in order
	createOneRandomModel (n, callback) {
		let flag = this.randomizer + (this.wantN(n) ? 'yes' : 'no');	// tells us which ones we want in test results
		this.models[n] = new DataModel({
			text: 'hello' + n,
			number: n,
			flag: flag
		});
		this.data.test.create(
			this.models[n].attributes,
			(error, createdModel) => {
				if (error) { return callback(error); }
				this.models[n].id = this.models[n].attributes._id = createdModel.id;
				callback();
			}
		);
	}

	// filter the test models down to only the ones we want in our test results
	filterTestModels (callback) {
		this.testModels = this.models.filter(model => {
			return this.wantN(model.get('number'));
		});
		// we'll also sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		this.testModels.sort((a, b) => {
			return a.get('number') - b.get('number');
		});
		callback();
	}

	// do an established update of the test model
	updateTestModel (callback) {
		const update = {
			_id: this.testModel.id,
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.testModel.attributes, update);
				callback();
			}
		);
	}

	// validate that we got back the model that exactly matches the test model
	validateModelResponse () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert(typeof this.response.attributes === 'object', 'improper fetched model');
		Assert.deepEqual(this.testModel.attributes, this.response.attributes, 'fetched model doesn\'t match');
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
	persist (callback) {
		this.data.test.persist(callback);
	}

	// clear the collection cache
	clearCache (callback) {
		this.data.test.clear();
		callback();
	}
}

module.exports = DataCollectionTest;
