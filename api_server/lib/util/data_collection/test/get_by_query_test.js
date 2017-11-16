'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByQueryTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by query';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createRandomModels,
			this.persist,
			this.filterTestModels
		], callback);
	}

	run (callback) {
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

module.exports = GetByQueryTest;
