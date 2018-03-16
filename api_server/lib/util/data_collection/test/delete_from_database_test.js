'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class DeleteFromDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should not get a model after it has been deleted and persisted';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,					// set up mongo client
			this.createTestAndControlModel, // create a test model and a control model that we won't touch
			this.deleteModel,				// delete the test model
			this.persist					// persist the deletion to the database
		], callback);
	}

	deleteModel (callback) {
		this.data.test.deleteById(
			this.testModel.id,
			callback
		);
	}

	// run the test...
	async run (callback) {
		// we'll fetch the test model and control model, but since the test model has been deleted,
		// we should only get the control model
		this.testModels = [this.controlModel];
		let response;
		try {
			response = await this.mongoData.test.getByIds([this.testModel.id, this.controlModel.id]);
		}
		catch (error) {
			return callback(error);
		}
		this.checkResponse(null, response, callback);
	}

	// validate the response
	validateResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		let testObjects = this.testModels.map(model => { return model.attributes; });
		// sort them by their numeric field, to ensure deep comparisons
		// are not thrown off by objects being fetched out of order
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(testObjects, this.response, 'fetched models don\'t match');
	}
}

module.exports = DeleteFromDatabaseTest;
