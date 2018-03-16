'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdsFromQueryCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, when models have been fetched by a query then cached';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up model client
			this.createRandomModels,	// create a series of random models
			this.filterTestModels,		// filter then down to the ones we've decided we want
			this.persist,				// persist all models to the database
			this.clearCache,			// clear the local cache
			this.queryModels,			// query for the models we want
			this.deleteModels			// delete the models in the database, but they'll stay in the cache
		], callback);
	}

	queryModels (callback) {
		// query for the models we want, this should put them in the cache for us to retrieve later
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array || response.length !== this.testModels.length)) {
					return callback('models that should have been fetched were not');
				}
				callback();
			}
		);
	}

	async deleteModels (callback) {
		// delete the models from the underlying database (note use of this.mongoData, not this.data)
		// this ensure that when we fetch them, we're fetching from the cache
		const ids = this.testModels.map(model => { return model.id; });
		try {
			await this.mongoData.test.deleteByIds(ids);
		}
		catch (error) {
			return callback(error);
		}
		callback();
	}

	// run the test...
	run (callback) {
		// now that we've decided on the models we want, since we queried for them using a query,
		// this should have put them in the cache ... so even though they've been deleted from the
		// database, we should still be able to fetch them
		let ids = this.testModels.map(model => { return model.id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		// ensure we get back the documents we want
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsFromQueryCacheTest;
