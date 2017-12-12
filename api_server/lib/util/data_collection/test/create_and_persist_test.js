'use strict';

var DataCollectionTest = require('./data_collection_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

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
	run (callback) {
		// fetch the document from the collection
		this.mongoData.test.getById(
			this.testModel.id,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		// validate that we got the object we expected
		this.validateObjectResponse();
	}
}

module.exports = CreateAndPersistTest;
