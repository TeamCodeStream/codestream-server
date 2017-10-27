'use strict';

var Get_By_Query_Test = require('./get_by_query_test');
var Assert = require('assert');

class Get_By_Query_Sort_Test extends Get_By_Query_Test {

	get description () {
		return 'should get the correct models in sorted order when getting several models by query with a sort option';
	}

	run (callback) {
		this.test_models.sort((a, b) => {
			return b.get('number') - a.get('number');
		});
		this.data.test.get_by_query(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.check_response(error, response, callback);
			},
			{
				database_options: {
					sort: { number: -1 }
				}
			}
		);
	}

	validate_array_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		let response_objects = this.response.map(model => { return model.attributes; });
		let test_objects = this.test_models.map(model => { return model.attributes; });
		Assert.deepEqual(test_objects, response_objects, 'fetched models don\'t match');
	}
}

module.exports = Get_By_Query_Sort_Test;
