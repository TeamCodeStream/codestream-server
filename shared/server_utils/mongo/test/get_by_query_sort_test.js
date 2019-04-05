'use strict';

const GetByQueryTest = require('./get_by_query_test');
const Assert = require('assert');

class GetByQuerySortTest extends GetByQueryTest {

	get description () {
		return 'should get the correct documents in sorted order when getting several documents by query with a sort option';
	}

	// run the test...
	run (callback) {
		// sort our test models so we can compare properly with the fetched models, and then fetch and compare
		this.testDocuments.sort((a, b) => {
			return b.number - a.number;
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
				this.checkResponse(error, response, callback);
			}
			this.checkResponse(null, response, callback);
		})();
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}
}

module.exports = GetByQuerySortTest;
