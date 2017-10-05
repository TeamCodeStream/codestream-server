'use strict';

var Get_By_Query_Test = require('./get_by_query_test');
var Assert = require('assert');

class Get_By_Query_Limit_Test extends Get_By_Query_Test {

	get_description () {
		return 'should get the correct limited models when getting several models by query with a limit option';
	}

	run (callback) {
		this.test_models.sort((a, b) => {
			return b.get('number') - a.get('number');
		});
		this.test_models.splice(3);
		this.data.test.get_by_query(
			{ flag: this.randomizer + 'yes' },
			(error, response) => {
				this.check_response(error, response, callback);
			},
			{
				database_options: {
					sort: { number: -1 },
					limit: 3
				}
			}
		);
	}

	validate_array_response () {
		Assert(this.response instanceof Array, 'response must be an array');
		let response_objects = this.response.map(model => { return model.attributes; });
		let test_objects = this.test_models.map(model => { return model.attributes; });
console.warn('r', response_objects);
console.warn('td', test_objects);
		Assert.deepEqual(response_objects, test_objects, 'fetched models don\'t match');
	}

}

module.exports = Get_By_Query_Limit_Test;
