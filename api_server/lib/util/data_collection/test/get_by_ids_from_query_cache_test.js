'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdsFromQueryCacheTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, when models have been fetched by a query then cached';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.filterTestModels,
			this.persist,
			this.clearCache,
			this.queryModels,
			this.deleteModels
		], callback);
	}

	queryModels (callback) {
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array || response.length !== this.testModels.length)) {
					return callback('models that should have been fetched were not');
				}
				callback();
			}
		);
	}

	deleteModels (callback) {
		let ids = this.testModels.map(model => { return model.id; });
		this.mongoData.test.deleteByIds(
			ids,
			callback
		);
	}

	run (callback) {
		let ids = this.testModels.map(model => { return model.id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByIdsFromQueryCacheTest;
