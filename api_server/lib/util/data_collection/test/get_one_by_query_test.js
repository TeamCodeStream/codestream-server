'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetOneByQueryTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting one model by query';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createRandomModels();	// create a series of random models
		await this.persist();				// persist those models to the database
		await this.clearCache();			// clear the local cache
	}

	// run the test...
	async run () {
		// the cache has been cleared, but we should be able to get a model by query,
		// since the DataCollection should go out to the database for the model
		this.testModel = this.models[4];
		const response = await this.data.test.getOneByQuery(
			{
				text: this.testModel.get('text'),
				flag: this.testModel.get('flag')
			}
		);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = GetOneByQueryTest;
