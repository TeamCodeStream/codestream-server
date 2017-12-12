'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetOneByQueryTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting one model by query';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomModels,	// create a series of random models
			this.persist,				// persist those models to the database
			this.clearCache				// clear the local cache
		], callback);
	}

	// run the test...
	run (callback) {
		// the cache has been cleared, but we should be able to get a model by query,
		// since the DataCollection should go out to the database for the model
		this.testModel = this.models[4];
		this.data.test.getOneByQuery(
			{
				text: this.testModel.get('text'),
				flag: this.testModel.get('flag')
			},
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = GetOneByQueryTest;
