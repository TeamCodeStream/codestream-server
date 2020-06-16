'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetByIdFromCacheAfterDeletedTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached, even if deleted in the database';
	}

	// before the test runs...
	async before () {
		await super.before();			// set up mongo client
		await this.createTestModel();	// create the test model
		await this.persist();			// persist it to the database
		await this.clearCache();		// clear the cache
		await this.getModel();			// get the model, since cache was cleared, this will come from the database
		await this.deleteModel();		// delete the model directly in the database, but it's still in the cache
	}

	async getModel () {
		await this.data.test.getById(this.testModel.id);
	}

	async deleteModel () {
		// we delete the model from the database (pulling the run out from under the cache)
		await this.mongoData.test.deleteById(this.testModel.id);
	}

	// run the test...
	async run () {
		// this should fetch the model from the cache, even though we've deleted it in the database
		const response = await this.data.test.getById(this.testModel.id);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = GetByIdFromCacheAfterDeletedTest;
