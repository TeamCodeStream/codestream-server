'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Update_To_Cache_Test = require('./update_to_cache_test');

class Apply_Add_To_Cache_Test extends Update_To_Cache_Test {

	get_description () {
		return 'should get the correct model after applying an add update to a cached model';
	}

	update_test_model (callback) {
		var update = {
			array: 7
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ add: update },
			(error) => {
				if (error) { return callback(error); }
				this.test_model.attributes.array.push(7);
				callback();
			}
		);
	}
}

module.exports = Apply_Add_To_Cache_Test;
