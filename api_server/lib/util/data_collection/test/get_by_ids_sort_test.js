'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class GetByIdsSortTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, including models from cache and from database, and sorted according to the given ids when provided';
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

		// randomize the order of ids
		this.randomIds = [];
		while (ids.length) {
			const randomIndex = Math.floor(Math.random() * ids.length);
			this.randomIds.push(ids[randomIndex]);
			ids.splice(randomIndex, 1);
		}
		const response = await this.data.test.getByIds(this.randomIds, { sortInOrder: true });
		await this.checkResponse(null, response);
	}

	validateResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		Assert.equal(this.response.length, this.randomIds.length, 'length of returned array does not match number of ids fetched');
		for (let i in this.randomIds) {
			Assert.equal(this.response[i].id, this.randomIds[i], 'object found out of order expected');
		}
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsSortTest;
