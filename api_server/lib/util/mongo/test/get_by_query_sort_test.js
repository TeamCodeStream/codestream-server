'use strict';

var GetByQueryTest = require('./get_by_query_test');
var Assert = require('assert');

class GetByQuerySortTest extends GetByQueryTest {

	get description () {
		return 'should get the correct documents in sorted order when getting several documents by query with a sort option';
	}

	run (callback) {
		this.testDocuments.sort((a, b) => {
			return b.number - a.number;
		});
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.checkResponse(error, response, callback);
			},
			{
				sort: { number: -1 }
			}
		);
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}
}

module.exports = GetByQuerySortTest;
