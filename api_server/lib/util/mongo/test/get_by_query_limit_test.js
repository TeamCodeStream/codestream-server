'use strict';

var GetByQueryTest = require('./get_by_query_test');
var Assert = require('assert');

class GetByQueryLimitTest extends GetByQueryTest {

	get description () {
		return 'should get the correct limited documents when getting several documents by query with a limit option';
	}

	run (callback) {
		this.testDocuments.sort((a, b) => {
			return b.number - a.number;
		});
		this.testDocuments.splice(3);
		this.data.test.getByQuery(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.checkResponse(error, response, callback);
			},
			{
				sort: { number: -1 },
				limit: 3
			}
		);
	}

	validateArrayResponse () {
		Assert(this.response instanceof Array, 'response must be an array');
		Assert.deepEqual(this.testDocuments, this.response, 'fetched documents don\'t match');
	}

}

module.exports = GetByQueryLimitTest;
