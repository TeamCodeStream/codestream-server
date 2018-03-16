'use strict';

var DataCollectionTest = require('./data_collection_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class CreateAndPersistTest extends DataCollectionTest {

	get description () {
		return 'should create a model that can then be fetched from the database by its ID after it is persisted';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,						// set up mongo client
			this.createTestAndControlModel,		// create a test model and a control model that won't be touched
			this.persist,						// persist the model to the database
			this.clearCache						// clear the cache, to make sure the document gets read from the database
		], callback);
	}

	// run the test...
	async run (callback) {
		// fetch the document from the collection
		let response;
		try {
			response = await this.mongoData.test.getById(this.testModel.id);
		}
		catch (error) {
			return callback(error);
		}
		this.checkResponse(null, response, callback);
	}

	validateResponse () {
		// validate that we got the object we expected
		this.validateObjectResponse();
	}
}

module.exports = CreateAndPersistTest;
