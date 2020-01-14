'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class GetOneByQuerySkipsCacheTest extends DataCollectionTest {

	get description () {
		return 'should get no models when fetching one model by query, when that model has not yet been persisted';
	}

	// before the test...
	async before () {
		await super.before();					// set up mongo client
		await this.createRandomModels();		// create a series of random models
		await this.confirmModelsNotPersisted();	// confirm that those models have NOT been persisted to the database
	}

	async confirmModelsNotPersisted () {
		// fetch our test models directly from the database (note this.mongoData below, not this.data)
		// since we haven't told the DataCollection to persist them, this should return no results
		let ids = this.models.map(model => { return model.id; });
		const response = await this.mongoData.test.getByIds(ids);
		if (!(response instanceof Array) || response.length !== 0) {
			throw 'models that should have gone to cache seem to have persisted';
		}
	}

	// run the test...
	async run () {
		// we'll look for this one model by query ... since the DataCollection does not support
		// querying the cache, and since these models have not yet been persisted, a query here
		// should not return any results
		let testModel = this.models[4];
		this.testModels = [];
		const response = await this.data.test.getOneByQuery(
			{
				text: testModel.get('text'),
				flag: testModel.get('flag')
			}
		);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		Assert(this.response === null, 'response not null');
	}
}

module.exports = GetOneByQuerySkipsCacheTest;
