'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionTest = require('./data_collection_test');

class GetByQueryTest extends DataCollectionTest {

	get description () {
		return 'should get the correct models when getting several models by query';
	}

	// before the test...
	before (callback) {
		BoundAsync.series(this, [
			super.before,				// set up mongo client
			this.createRandomModels,	// create a series of random models
			this.persist,				// persist those models to the database
			this.filterTestModels		// filter our test models to the ones we want
		], callback);
	}

	// run the test...
	run (callback) {
		(async () => {
			// do the query
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' }
				);
			}
			catch (error) {
				return callback(error);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	validateResponse () {
		this.validateArrayResponse();
	}
}

module.exports = GetByQueryTest;
