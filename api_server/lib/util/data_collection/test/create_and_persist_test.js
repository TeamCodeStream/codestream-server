'use strict';

const DataCollectionTest = require('./data_collection_test');

class CreateAndPersistTest extends DataCollectionTest {

	get description () {
		return 'should create a model that can then be fetched from the database by its ID after it is persisted';
	}

	// before the test runs...
	async before () {
		await super.before();						// set up mongo client
		await this.createTestAndControlModel();		// create a test model and a control model that won't be touched
		await this.persist();						// persist the model to the database
		await this.clearCache();					// clear the cache, to make sure the document gets read from the database
	}

	// run the test...
	async run () {
		// fetch the document from the collection
		const response = await this.mongoData.test.getById(this.testModel.id);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		// validate that we got the object we expected
		this.validateObjectResponse();
	}
}

module.exports = CreateAndPersistTest;
