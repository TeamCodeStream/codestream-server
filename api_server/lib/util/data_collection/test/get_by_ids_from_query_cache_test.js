'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetByIdsFromQueryCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, when models have been fetched by a query then cached';
	}

	// before the test runs...
	async before () {
		await super.before();				// set up model client
		await this.createRandomModels();	// create a series of random models
		await this.filterTestModels();		// filter then down to the ones we've decided we want
		await this.persist();				// persist all models to the database
		await this.clearCache();			// clear the local cache
		await this.queryModels();			// query for the models we want
		await this.deleteModels();			// delete the models in the database, but they'll stay in the cache
	}

	async queryModels () {
		// query for the models we want, this should put them in the cache for us to retrieve later
		const response = await this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' }
		);
		if (!(response instanceof Array || response.length !== this.testModels.length)) {
			throw 'models that should have been fetched were not';
		}
	}

	async deleteModels () {
		// delete the models from the underlying database (note use of this.mongoData, not this.data)
		// this ensure that when we fetch them, we're fetching from the cache
		const ids = this.testModels.map(model => { return model.id; });
		await this.mongoData.test.deleteByIds(ids);
	}

	// run the test...
	async run () {
		// now that we've decided on the models we want, since we queried for them using a query,
		// this should have put them in the cache ... so even though they've been deleted from the
		// database, we should still be able to fetch them
		const ids = this.testModels.map(model => { return model.id; });
		const response = await this.data.test.getByIds(ids);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		// ensure we get back the documents we want
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsFromQueryCacheTest;
