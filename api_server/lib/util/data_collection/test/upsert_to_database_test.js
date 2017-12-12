'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var ObjectID = require('mongodb').ObjectID;
var DataModel = require('../data_model');

class UpsertToDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after upserting a model that did not exist and persisting';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.upsertTestModel,	// upsert a test model (which creates it even if we are doing an update)
			this.persist,			// persist that model to the database
			this.clearCache			// clear the cache
		], callback);
	}

	// "upsert" a test model (update with an insert options)
	upsertTestModel (callback) {
		// do an update operation with the upsert option, this should create the document even though
		// it did not exist before
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
		this.data.test.update(
			this.testModel.attributes,
			callback,
			{ databaseOptions: { upsert: true } }
		);
	}

	// run the test...
	run (callback) {
		// fetch the model directly from the database, if the upsert worked, we should just get it from the database
		this.mongoData.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateObjectResponse();
	}
}

module.exports = UpsertToDatabaseTest;
