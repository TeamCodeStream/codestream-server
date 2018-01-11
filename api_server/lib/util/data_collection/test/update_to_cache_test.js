'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class UpdateToCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after updating a cached model';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createTestModel,		// create our test model (not persisted)
			this.updateTestModel,		// update our test model (still not persisted)
			this.confirmNotPersisted	// confirm our model has not been persisted to the database
		], callback);
	}

	// run test test...
	run (callback) {
		// ensure we can get our test model, even though it has not been persisted to the database
		// this tests that caching is working properly
		this.data.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateModelResponse();
	}
}

module.exports = UpdateToCacheTest;
