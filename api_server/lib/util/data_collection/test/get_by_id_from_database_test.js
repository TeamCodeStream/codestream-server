'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');
var DataModel = require('../data_model');

class GetByIdFromDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is not cached';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.createModelDirect	// create a model directly in the database (bypassing cache)
		], callback);
	}

	async createModelDirect (callback) {
		this.testModel = new DataModel({
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5]
		});
		// note that we're calling this.mongoData.test.create, not this.data.test.create
		// this creates the document in the database directly, bypassing the cache
		let createdDocument;
		try {
			createdDocument = await this.mongoData.test.create(this.testModel.attributes);
		}
		catch (error) {
			return callback(error);
		}
		this.testModel.id = this.testModel.attributes._id = createdDocument._id;
		callback();
	}

	async run (callback) {
		// this should fetch the document from the database, since it was never cached
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

module.exports = GetByIdFromDatabaseTest;
