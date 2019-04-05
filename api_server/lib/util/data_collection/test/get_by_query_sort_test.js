'use strict';

var GetByQueryTest = require('./get_by_query_test');
var Assert = require('assert');

class GetByQuerySortTest extends GetByQueryTest {

	get description () {
		return 'should get the correct models in sorted order when getting several models by query with a sort option';
	}

	run (callback) {
		// sort our test models so we can compare properly with the fetched models
		this.testModels.sort((a, b) => {
			return b.get('number') - a.get('number');
		});

		(async () => {
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' },
					{
						sort: { number: -1 }
					}
				);
			}
			catch (error) {
				return callback(error);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		let responseObjects = this.response.map(model => { return model.attributes; });
		let testObjects = this.testModels.map(model => { return model.attributes; });
		Assert.deepEqual(testObjects, responseObjects, 'fetched models don\'t match');
	}
}

module.exports = GetByQuerySortTest;
