'use strict';

const GetByQueryTest = require('./get_by_query_test');
const Assert = require('assert');

class GetByQueryLimitTest extends GetByQueryTest {

	get description () {
		return 'should get the correct limited models when getting several models by query with a limit option';
	}

	// run the test...
	async run () {
		// make sure our test models are sorted by number, so we can be consistent about which ones we're
		// limiting ourselves to
		this.testModels.sort((a, b) => {
			return b.get('number') - a.get('number');
		});

		// we're counting on how the test models are set up here (see data_collection_test.js), knowing
		// which models are expected to come back with this query
		this.testModels.splice(3);
		const response = await this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			{
				sort: { number: -1 },
				limit: 3
			}
		);
		await this.checkResponse(null, response);
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		const responseObjects = this.response.map(model => { return model.attributes; });
		const testObjects = this.testModels.map(model => { return model.attributes; });
		Assert.deepEqual(testObjects, responseObjects, 'fetched models don\'t match');
	}

}

module.exports = GetByQueryLimitTest;
