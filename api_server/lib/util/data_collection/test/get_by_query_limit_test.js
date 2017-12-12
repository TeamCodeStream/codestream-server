'use strict';

var GetByQueryTest = require('./get_by_query_test');
var Assert = require('assert');

class GetByQueryLimitTest extends GetByQueryTest {

	get description () {
		return 'should get the correct limited models when getting several models by query with a limit option';
	}

	// run the test...
	run (callback) {
		// make sure our test models are sorted by number, so we can be consistent about which ones we're
		// limiting ourselves to
		this.testModels.sort((a, b) => {
			return b.get('number') - a.get('number');
		});
		// we're counting on how the test models are set up here (see data_collection_test.js), knowing
		// which models are expected to come back with this query
		this.testModels.splice(3);
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.checkResponse(error, response, callback);
			},
			{
				databaseOptions: {
					sort: { number: -1 },
					limit: 3
				}
			}
		);
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		let responseObjects = this.response.map(model => { return model.attributes; });
		let testObjects = this.testModels.map(model => { return model.attributes; });
		Assert.deepEqual(testObjects, responseObjects, 'fetched models don\'t match');
	}

}

module.exports = GetByQueryLimitTest;
