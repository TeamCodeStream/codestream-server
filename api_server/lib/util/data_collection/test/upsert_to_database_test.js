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
			super.before,
			this.upsertTestModel,
			this.persist,
			this.clearCache
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
			{ databaseOptions: { upsert: true } }
		);
	}

	run (callback) {
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
