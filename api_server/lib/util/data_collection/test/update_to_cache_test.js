'use strict';

const DataCollectionTest = require('./data_collection_test');

class UpdateToCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after updating a cached model';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createTestModel();		// create our test model (not persisted)
		await this.updateTestModel();		// update our test model (still not persisted)
		await this.confirmNotPersisted();	// confirm our model has not been persisted to the database
	}

	// run test test...
	async run () {
		// ensure we can get our test model, even though it has not been persisted to the database
		// this tests that caching is working properly
		const response = await this.data.test.getById(this.testModel.id);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = UpdateToCacheTest;
