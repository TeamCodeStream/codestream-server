'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetByQuerySkipsCacheTest extends DataCollectionTest {

	get description () {
		return 'should get no models when fetching several models by query, when those models have not yet been persisted';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createRandomModels();	// create a series of random models
		await this.filterTestModels();		// filter down only to the test models we are interested in
		await this.confirmInCache();			// confirm that those models are in the cache
	}

	// confirm that our test models are in the cache, by fetching them by ID even though they haven't been persissted
	async confirmInCache () {
		// this is just to ensure that, when fetching by ID, the DataCollection class can indeed get
		// the models from the cache ... later, we'll make sure we CAN NOT actually get the models
		// by a direct query to the database, since these models have not yet been persisted
		const ids = this.testModels.map(model => { return model.id; });
		const response = await this.data.test.getByIds(ids);
		if (!(response instanceof Array || response.length !== this.testModels.length)) {
			throw 'models that should be cached were not fetched';
		}
	}

	// run the test...
	async run () {
		// here we should not get back ANY documents, since we don't actually run queries on the cache,
		// so fetching expected models by query will not work against cached documents ... this is an
		// inherent weakness to the DataCollection class that should be understood
		this.testModels = [];
		const response = await this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' }
		);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQuerySkipsCacheTest;
