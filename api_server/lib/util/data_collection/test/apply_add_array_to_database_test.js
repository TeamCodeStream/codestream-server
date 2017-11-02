'use strict';

var Update_To_Database_Test = require('./update_to_database_test');

class Apply_Add_Array_To_Database_Test extends Update_To_Database_Test {

	get description () {
		return 'should get the correct model after applying an add array update and persisting';
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

module.exports = Apply_Add_Array_To_Database_Test;
