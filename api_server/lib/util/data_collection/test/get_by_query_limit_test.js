'use strict';

var GetByQueryTest = require('./get_by_query_test');
var Assert = require('assert');

class GetByQueryLimitTest extends GetByQueryTest {

	get description () {
		return 'should get the correct limited models when getting several models by query with a limit option';
	}

	run (callback) {
		this.testModels.sort((a, b) => {
			return b.get('number') - a.get('number');
		});
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
