'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdsTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, including models from cache and from database';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomModels,	// create a series of random models
			this.filterTestModels,		// filter them down to those we've decided we want
			this.persist,				// persist them to the database
			this.clearCache,			// clear the cache
			this.getSomeTestModels		// get some of the test models, this puts only some of them in the cache
		], callback);
	}

	getSomeTestModels (callback) {
		// fetch some of our test models, this will put some of them in the cache; when we go to fetch,
		// we will fetch these plus others, ensuring the data collection can handle fetching from cache
		// and database as needed
		let ids = this.testModels.map(model => { return model.id; });
		let someIds = [...ids].splice(Math.trunc(ids.length / 2));
		if (someIds.length >= ids.length) {
			return callback('not enough models to run this test');
		}
		this.data.test.getByIds(
			someIds,
			callback
		);
	}

	// run the test...
	run (callback) {
		// get our test models, this will include those that are in the cache and those that must
		// be fetched from the database
		let ids = this.testModels.map(model => { return model.id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsTest;
