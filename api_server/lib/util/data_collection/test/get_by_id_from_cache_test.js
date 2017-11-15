'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdFromCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct model when getting a model by ID and it is cached';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestAndControlModel,
			this.confirmNotPersisted
		], callback);
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

module.exports = GetByIdFromCacheTest;
