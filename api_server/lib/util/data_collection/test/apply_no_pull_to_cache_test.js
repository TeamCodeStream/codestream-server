'use strict';

var Update_To_Cache_Test = require('./update_to_cache_test');

class Apply_No_Pull_To_Cache_Test extends Update_To_Cache_Test {

	get description () {
		return 'should get the correct model after applying a no-op pull update to a cached model';
	}

	update_test_model (callback) {
		const update = {
			array: 8
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ pull: update },
			callback
		);
	}
}

module.exports = Apply_No_Pull_To_Cache_Test;
