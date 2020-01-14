'use strict';

const DataCollectionTest = require('./data_collection_test');

class UpdateToDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after updating a model and persisting';
	}

	// before the test...
	async before () {
		await super.before();			// set up mongo client
		await this.createTestModel();	// create a test model
		await this.persist();			// persist the model to the database
		await this.clearCache();		// clear the cache
		await this.updateTestModel();	// update the test model
		await this.persist();			// persist the update
	}

	// run the test...
	async run () {
		// fetch our test model directly from the database, the change should be reflected
		// because we persisted the update ... since our test model has the update already,
		// it should match the object returned
		const response = await this.mongoData.test.getById(this.testModel.id);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateObjectResponse();
	}
}

module.exports = UpdateToDatabaseTest;
