'use strict';

var Get_By_Query_Test = require('./get_by_query_test');
var Assert = require('assert');

class Get_By_Query_Limit_Test extends Get_By_Query_Test {

	get description () {
		return 'should get the correct limited documents when getting several documents by query with a limit option';
	}

	run (callback) {
		this.test_documents.sort((a, b) => {
			return b.number - a.number;
		});
		this.test_documents.splice(3);
		this.data.test.get_by_query(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.check_response(error, response, callback);
			},
			{
				sort: { number: -1 },
				limit: 3
			}
		);
	}

	validate_array_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		Assert.deepEqual(this.response, this.test_documents, 'fetched documents don\'t match');
	}

}

module.exports = Get_By_Query_Limit_Test;
