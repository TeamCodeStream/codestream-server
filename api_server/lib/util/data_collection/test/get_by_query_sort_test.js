'use strict';

const GetByQueryTest = require('./get_by_query_test');
const Assert = require('assert');

class GetByQuerySortTest extends GetByQueryTest {

	get description () {
		return 'should get the correct models in sorted order when getting several models by query with a sort option';
	}

	async run () {
		// sort our test models so we can compare properly with the fetched models
		this.testModels.sort((a, b) => {
			return b.get('number') - a.get('number');
		});

		const response = await this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			{
				sort: { number: -1 }
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

module.exports = GetByQuerySortTest;
