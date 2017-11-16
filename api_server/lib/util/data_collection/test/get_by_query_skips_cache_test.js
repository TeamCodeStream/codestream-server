'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByQuerySkipsCacheTest extends DataCollectionTest {

	get description () {
		return 'should get no models when fetching several models by query, when those models have not yet been persisted';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.filterTestModels,
			this.confirmInCache
		], callback);
	}

	confirmInCache (callback) {
		let ids = this.testModels.map(model => { return model.id; });
		this.data.test.getByIds(
			ids,
			(error, response) => {
				if (error) { return callback(error); }
				if (!(response instanceof Array || response.length !== this.testModels.length)) {
					return callback('models that should be cached were not fetched');
				}
				callback();
			}
		);
	}

	run (callback) {
		this.testModels = [];
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.checkResponse(error, response, callback);
			}
		);
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQuerySkipsCacheTest;
