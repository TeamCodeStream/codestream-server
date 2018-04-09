'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdFromCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,					// set up mongo client
			this.createTestAndControlModel,	// create a test model and a control model
			this.confirmNotPersisted		// confirm that the test model did not get persisted
		], callback);
	}

	// run the test...
	async run (callback) {
		let response;
		try {
			response = await this.data.test.getById(this.testModel.id);
		}
		catch (error) {
			return callback(error);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		// we should get the model, since it is cached, even though it is not persisted
		this.validateModelResponse();
	}
}

module.exports = GetByIdFromCacheTest;
