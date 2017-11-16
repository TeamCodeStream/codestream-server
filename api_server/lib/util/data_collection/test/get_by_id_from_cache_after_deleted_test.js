'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdFromCacheAfterDeletedTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached, even if deleted in the database';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestModel,
			this.persist,
			this.clearCache,
			this.getModel,
			this.deleteModel
		], callback);
	}

	getModel (callback) {
		this.data.test.getById(
			this.testModel.id,
			callback
		);
	}

	deleteModel (callback) {
		this.mongoData.test.deleteById(
			this.testModel.id,
			callback
		);
	}

	run (callback) {
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

module.exports = GetByIdFromCacheAfterDeletedTest;
