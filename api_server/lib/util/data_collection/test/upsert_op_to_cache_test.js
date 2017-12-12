'use strict';

var UpsertToCacheTest = require('./upsert_to_cache_test');
var ObjectID = require('mongodb').ObjectID;
var DataModel = require('../data_model');

// a variation of UpsertToCacheTest, where instead of an update operation, we'll use a $set op
// (which should give the same results)
class UpsertOpToCacheTest extends UpsertToCacheTest {

	get description () {
		return 'should get the correct model after upserting a cached model by op that did not exist before';
	}

	// run a $set op on the model, but provide the upsert option, this should create the model
	upsertTestModel (callback) {
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
		this.data.test.applyOpById(
			this.testModel.id,
			{ $set: this.testModel.attributes },
			callback,
			{ upsert: true }
		);
	}
}

module.exports = UpsertOpToCacheTest;
