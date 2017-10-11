'use strict';

var Update_To_Cache_Test = require('./update_to_cache_test');

class Apply_Pull_To_Cache_Test extends Update_To_Cache_Test {

	get description () {
		return 'should get the correct model after applying a pull update to a cached model';
	}

	update_test_model (callback) {
		const update = {
			array: 4
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ pull: update },
			(error) => {
				if (error) { return callback(error); }
				let index = this.test_model.attributes.array.indexOf(4);
				this.test_model.attributes.array.splice(index, 1);
				callback();
			}
		);
	}
}

module.exports = Apply_Pull_To_Cache_Test;
