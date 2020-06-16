'use strict';

const DataCollectionTest = require('./data_collection_test');
const Assert = require('assert');

class DeleteFromDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should not get a model after it has been deleted and persisted';
	}

	// before the test runs...
	async before () {
		await super.before();					// set up mongo client
		await this.createTestAndControlModel(); // create a test model and a control model that we won't touch
		await this.deleteModel();				// delete the test model
		await this.persist();					// persist the deletion to the database
	}

	async deleteModel () {
		await this.data.test.deleteById(this.testModel.id);
	}

	// run the test...
	async run () {
		// we'll fetch the test model and control model, but since the test model has been deleted,
		// we should only get the control model
		this.testModels = [this.controlModel];
		const response = await this.mongoData.test.getByIds([this.testModel.id, this.controlModel.id]);
		await this.checkResponse(null, response);
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
