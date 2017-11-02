'use strict';

var Update_To_Cache_Test = require('./update_to_cache_test');

class Apply_Add_Array_To_Cache_Test extends Update_To_Cache_Test {

	get description () {
		return 'should get the correct model after applying an add array update to a cached model';
	}

	update_test_model (callback) {
		const update = {
			array: [5, 7, 8]
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ add: update },
			(error) => {
				if (error) { return callback(error); }
				this.test_model.attributes.array.push(7);
				this.test_model.attributes.array.push(8);
				callback();
			}
		);
	}
}

module.exports = Apply_Add_Array_To_Cache_Test;
