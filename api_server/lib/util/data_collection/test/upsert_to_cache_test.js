'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var ObjectID = require('mongodb').ObjectID;
var DataModel = require('../data_model');

class UpsertToCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after upserting a cached model that did not exist before';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.upsertTestModel,
			this.confirmNotPersisted
		], callback);
	}

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
		this.data.test.update(
			this.testModel.attributes,
			callback,
			{ upsert: true }
		);
	}

	run (callback) {
		this.data.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = UpsertToCacheTest;
