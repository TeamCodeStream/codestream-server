'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class UpdateToDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model after updating a model and persisting';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,			// set up mongo client
			this.createTestModel,	// create a test model
			this.persist,			// persist the model to the database
			this.clearCache,		// clear the cache
			this.updateTestModel,	// update the test model
			this.persist			// persist the update
		], callback);
	}

	// run the test...
	run (callback) {
		// fetch our test model directly from the database, the change should be reflected
		// because we persisted the update ... since our test model has the update already,
		// it should match the object returned
		this.mongoData.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateObjectResponse();
	}
}

module.exports = UpdateToDatabaseTest;
