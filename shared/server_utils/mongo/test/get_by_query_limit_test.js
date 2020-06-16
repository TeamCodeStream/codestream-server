'use strict';

const GetByQueryTest = require('./get_by_query_test');
const Assert = require('assert');

class GetByQueryLimitTest extends GetByQueryTest {

	get description () {
		return 'should get the correct limited documents when getting several documents by query with a limit option';
	}

	// run the test...
	run (callback) {
		// make sure our test models are sorted by number, so we can be consistent about which ones we're
		// limiting ourselves to
		this.testDocuments.sort((a, b) => {
			return b.number - a.number;
		});

		(async () => {
			// we're counting on how the test models are set up here (see mongo_test.js), knowing
			// which models are expected to come back with this query
			this.testDocuments.splice(3);
			let response;
			try {
				response = await this.data.test.getByQuery(
					{ flag: this.randomizer + 'yes' },
					{
						sort: { number: -1 },
						limit: 3
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

module.exports = GetByQueryLimitTest;
