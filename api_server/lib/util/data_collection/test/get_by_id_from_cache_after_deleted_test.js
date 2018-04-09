'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdFromCacheAfterDeletedTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached, even if deleted in the database';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.createTestModel,	// create the test model
			this.persist,			// persist it to the database
			this.clearCache,		// clear the cache
			this.getModel,			// get the model, since cache was cleared, this will come from the database
			this.deleteModel		// delete the model directly in the database, but it's still in the cache
		], callback);
	}

	async getModel (callback) {
		// we get the model from the cache
		try {
			await this.data.test.getById(this.testModel.id);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	async deleteModel (callback) {
		// we delete the model from the database (pulling the run out from under the cache)
		try {
			await this.mongoData.test.deleteById(this.testModel.id);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	// run the test...
	async run (callback) {
		// this should fetch the model from the cache, even though we've deleted it in the database
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

module.exports = GetByIdFromCacheAfterDeletedTest;
