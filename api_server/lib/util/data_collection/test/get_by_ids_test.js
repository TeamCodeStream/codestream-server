'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByIdsTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by ID, including models from cache and from database';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.filterTestModels,
			this.persist,
			this.clearCache,
			this.getSomeTestModels
		], callback);
	}

	getSomeTestModels (callback) {
		let ids = this.testModels.map(model => { return model.id; });
		let someIds = [...ids].splice(Math.trunc(ids.length / 2));
		if (someIds.length >= ids.length) {
			return callback('not enough models to run this test');
		}
		this.data.test.getByIds(
			someIds,
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

module.exports = GetByIdsTest;
