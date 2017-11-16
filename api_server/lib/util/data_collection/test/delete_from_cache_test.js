'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class DeleteFromCacheTest extends DataCollectionTest {

	get description () {
		return 'should not get a model after it has been deleted from the cache';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestAndControlModel,
			this.deleteModel
		], callback);
	}

	deleteModel (callback) {
		this.data.test.deleteById(
			this.testModel.id,
			callback
		);
	}

	run (callback) {
		this.testModels = [this.controlModel];
		this.data.test.getByIds(
			[this.testModel.id, this.controlModel.id],
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = DeleteFromCacheTest;
