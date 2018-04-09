'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class GetOneByQuerySkipsCacheTest extends DataCollectionTest {

	get description () {
		return 'should get no models when fetching one model by query, when that model has not yet been persisted';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,					// set up mongo client
			this.createRandomModels,		// create a series of random models
			this.confirmModelsNotPersisted	// confirm that those models have NOT been persisted to the database
		], callback);
	}

	async confirmModelsNotPersisted (callback) {
		// fetch our test models directly from the database (note this.mongoData below, not this.data)
		// since we haven't told the DataCollection to persist them, this should return no results
		let ids = this.models.map(model => { return model.id; });
		let response;
		try {
			response = await this.mongoData.test.getByIds(ids);
		}
		catch (error) {
			return callback(error);
		}
		if (!(response instanceof Array) || response.length !== 0) {
			return callback('models that should have gone to cache seem to have persisted');
		}
		callback();
	}

	// run the test...
	async run (callback) {
		// we'll look for this one model by query ... since the DataCollection does not support
		// querying the cache, and since these models have not yet been persisted, a query here
		// should not return any results
		let testModel = this.models[4];
		this.testModels = [];
		let response;
		try {
			response = await this.data.test.getOneByQuery(
				{
					text: testModel.get('text'),
					flag: testModel.get('flag')
				}
			);
		}
		catch (error) {
			return callback(error);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		Assert(this.response === null, 'response not null');
	}
}

module.exports = GetOneByQuerySkipsCacheTest;
