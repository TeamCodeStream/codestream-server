'use strict';

const DataCollectionTest = require('./data_collection_test');

class GetByIdsTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, including models from cache and from database';
	}

	// before the test...
	async before () {
		await super.before();				// set up mongo client
		await this.createRandomModels();	// create a series of random models
		await this.filterTestModels();		// filter them down to those we've decided we want
		await this.persist();				// persist them to the database
		await this.clearCache();			// clear the cache
		await this.getSomeTestModels();		// get some of the test models, this puts only some of them in the cache
	}

	async getSomeTestModels () {
		// fetch some of our test models, this will put some of them in the cache; when we go to fetch,
		// we will fetch these plus others, ensuring the data collection can handle fetching from cache
		// and database as needed
		const ids = this.testModels.map(model => { return model.id; });
		const someIds = [...ids].splice(Math.trunc(ids.length / 2));
		if (someIds.length >= ids.length) {
			throw 'not enough models to run this test';
		}
		await this.data.test.getByIds(someIds);
	}

	// run the test...
	async run () {
		// get our test models, this will include those that are in the cache and those that must
		// be fetched from the database
		const ids = this.testModels.map(model => { return model.id; });
		const response = await this.data.test.getByIds(ids);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsTest;
