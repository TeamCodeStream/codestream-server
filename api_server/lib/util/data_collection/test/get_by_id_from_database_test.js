'use strict';

const DataCollectionTest = require('./data_collection_test');
const DataModel = require('../data_model');

class GetByIdFromDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is not cached';
	}

	// before the test runs...
	async before () {
		await super.before();			// set up mongo client
		await this.createModelDirect();	// create a model directly in the database (bypassing cache)
	}

	async createModelDirect () {
		this.testModel = new DataModel({
			text: 'hello',
			number: 12345,
			array: [1, 2, 3, 4, 5]
		});
		
		// note that we're calling this.mongoData.test.create, not this.data.test.create
		// this creates the document in the database directly, bypassing the cache
		const createdDocument = await this.mongoData.test.create(this.testModel.attributes);
		this.testModel.id = this.testModel.attributes.id = createdDocument.id;
	}

	async run () {
		// this should fetch the document from the database, since it was never cached
		const response = await this.data.test.getById(this.testModel.id);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = GetByIdFromDatabaseTest;
