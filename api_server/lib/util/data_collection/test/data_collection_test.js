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

	before (callback) {
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

	createTestAndControlModel (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestModel,
			this.createControlModel
		], callback);
	}

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

	createRandomModels (callback) {
		this.models = new Array(10);
		this.randomizer = RandomString.generate(20);
		BoundAsync.times(
			this,
			10,
			this.createOneRandomModel,
			callback
		);
	}

	wantN (n) {
		return n % 2 || n === 6;
	}

	createOneRandomModel (n, callback) {
		let flag = this.randomizer + (this.wantN(n) ? 'yes' : 'no');
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

	filterTestModels (callback) {
		this.testModels = this.models.filter(model => {
			return this.wantN(model.get('number'));
		});
		this.testModels.sort((a, b) => {
			return a.get('number') - b.get('number');
		});
		callback();
	}

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

	validateModelResponse () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert(typeof this.response.attributes === 'object', 'improper fetched model');
		Assert.deepEqual(this.testModel.attributes, this.response.attributes, 'fetched model doesn\'t match');
	}

	validateObjectResponse () {
		Assert(typeof this.response === 'object', 'improper response');
		Assert.deepEqual(this.testModel.attributes, this.response, 'fetched object doesn\'t match');
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		let responseObjects = this.response.map(model => { return model.attributes; });
		let testObjects = this.testModels.map(model => { return model.attributes; });
		responseObjects.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(testObjects, responseObjects, 'fetched models don\'t match');
	}

	persist (callback) {
		this.data.test.persist(callback);
	}

	clearCache (callback) {
		this.data.test.clear();
		callback();
	}
}

module.exports = DataCollectionTest;
