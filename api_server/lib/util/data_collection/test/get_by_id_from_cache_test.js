'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetByIdFromCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached';
	}

	// before the test...
	async before () {
		await super.before();					// set up mongo client
		await this.createTestAndControlModel();	// create a test model and a control model
		await this.confirmNotPersisted();		// confirm that the test model did not get persisted
	}

	// run the test...
	async run () {
		const response = await this.data.test.getById(this.testModel.id);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		// we should get the model, since it is cached, even though it is not persisted
		this.validateModelResponse();
	}
}

module.exports = GetByIdFromCacheTest;
