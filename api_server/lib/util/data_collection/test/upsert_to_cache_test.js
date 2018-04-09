'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');
var ObjectID = require('mongodb').ObjectID;
var DataModel = require('../data_model');

class UpsertToCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after upserting a cached model that did not exist before';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.upsertTestModel,		// upsert a test model, creating it if it doesn't exist
			this.confirmNotPersisted	// confirm the document hasn't been persisted to the database
		], callback);
	}

	// "upsert" a test model (update with an insert options)
	async upsertTestModel (callback) {
		// do an update operation with the upsert option, this should create the document even though
		// it did not exist before (but only in the cache, because we're not persisting)
		this.testModel = new DataModel({
			_id: ObjectID(),
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5],
			object: {
				x: 1,
				y: 2.1,
				z: 'three'
			}
		});
		try {
			await this.data.test.update(
				this.testModel.attributes,
				{ upsert: true }
			);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	// run the test...
	async run (callback) {
		// fetch the model, if the upsert worked, we should just get it from the cache
		let response;
		try {
			response = await this.data.test.getById(this.testModel.id);
		}
		catch (error) {
			return callback(error);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = UpsertToCacheTest;
