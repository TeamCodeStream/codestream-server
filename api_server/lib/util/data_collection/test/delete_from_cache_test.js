'use strict';

const DataCollectionTest = require('./data_collection_test');

class DeleteFromCacheTest extends DataCollectionTest {

	get description () {
		return 'should not get a model after it has been deleted from the cache';
	}

	// before the test runs...
	async before () {
		await super.before();					// set up mongo client
		await this.createTestAndControlModel();	// create a test model and a control model that we won't touch
		await this.deleteModel();				// delete the test model
	}

	async deleteModel () {
		await this.data.test.deleteById(this.testModel.id);
	}

	// run the test...
	async run () {
		// we'll fetch the test model and control model, but since the test model has been deleted,
		// we should only get the control model
		this.testModels = [this.controlModel];
		const response = await this.data.test.getByIds(
			[this.testModel.id, this.controlModel.id]
		);
		await this.checkResponse(null, response);
	}

	validateResponse () {
		// validate that we get only the control model
		this.validateArrayResponse();
	}
}

module.exports = DeleteFromCacheTest;
