'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class DeleteFromDatabaseTest extends DataCollectionTest {

	get description () {
		return 'should not get a model after it has been deleted and persisted';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestAndControlModel,
			this.deleteModel,
			this.persist
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
		this.mongoData.test.getByIds(
			[this.testModel.id, this.controlModel.id],
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		let testObjects = this.testModels.map(model => { return model.attributes; });
		this.response.sort((a, b) => {
			return a.number - b.number;
		});
		Assert.deepEqual(testObjects, this.response, 'fetched models don\'t match');
	}
}

module.exports = DeleteFromDatabaseTest;
