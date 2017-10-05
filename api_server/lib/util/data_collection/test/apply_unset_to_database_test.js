'use strict';

var Update_To_Database_Test = require('./update_to_database_test');

class Apply_Unset_To_Database_Test extends Update_To_Database_Test {

	get_description () {
		return 'should get the correct model after applying an unset update and persisting';
	}

	update_test_model (callback) {
		var unset = {
			text: 1,
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ unset: unset },
			(error) => {
				if (error) { return callback(error); }
				delete this.test_model.attributes.text;
				callback();
			}
		);
	}
}

module.exports = Apply_Unset_To_Database_Test;
