'use strict';

var Update_To_Database_Test = require('./update_to_database_test');

class Apply_Set_To_Database_Test extends Update_To_Database_Test {

	get description () {
		return 'should get the correct model after applying a set update and persisting';
	}

	update_test_model (callback) {
		const set = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ set: set },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_model.attributes, set);
				callback();
			}
		);
	}
}

module.exports = Apply_Set_To_Database_Test;
