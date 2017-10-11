'use strict';

var Update_To_Database_Test = require('./update_to_database_test');

class Apply_Push_To_Database_Test extends Update_To_Database_Test {

	get description () {
		return 'should get the correct model after applying a push update and persisting';
	}

	update_test_model (callback) {
		const update = {
			array: 7
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ push: update },
			(error) => {
				if (error) { return callback(error); }
				this.test_model.attributes.array.push(7);
				callback();
			}
		);
	}
}

module.exports = Apply_Push_To_Database_Test;
