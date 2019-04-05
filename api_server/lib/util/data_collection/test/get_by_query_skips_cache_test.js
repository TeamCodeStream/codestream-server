'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByQuerySkipsCacheTest extends DataCollectionTest {

	get description () {
		return 'should get no models when fetching several models by query, when those models have not yet been persisted';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomModels,	// create a series of random models
			this.filterTestModels,		// filter down only to the test models we are interested in
			this.confirmInCache			// confirm that those models are in the cache
		], callback);
	}

	// confirm that our test models are in the cache, by fetching them by ID even though they haven't been persissted
	confirmInCache (callback) {
		(async () => {
			// this is just to ensure that, when fetching by ID, the DataCollection class can indeed get
			// the models from the cache ... later, we'll make sure we CAN NOT actually get the models
			// by a direct query to the database, since these models have not yet been persisted
			const ids = this.testModels.map(model => { return model.id; });
			let response;
			try {
				response = await this.data.test.getByIds(ids);
			}
			catch (error) {
				return callback(error);
			}
			if (!(response instanceof Array || response.length !== this.testModels.length)) {
				return callback('models that should be cached were not fetched');
			}
			callback();
		})();
	}

	// run the test...
	run (callback) {
		(async () => {
			// here we should not get back ANY documents, since we don't actually run queries on the cache,
			// so fetching expected models by query will not work against cached documents ... this is an
			// inherent weakness to the DataCollection class that should be understood
			this.testModels = [];
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' }
				);
			}
			catch (error) {
				return callback(error);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQuerySkipsCacheTest;
