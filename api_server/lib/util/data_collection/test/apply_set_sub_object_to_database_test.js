'use strict';

var Update_To_Database_Test = require('./update_to_database_test');

class Apply_Set_Sub_Object_To_Database_Test extends Update_To_Database_Test {

	get_description () {
		return 'should get the correct model after applying a sub-object set to a model and persisting';
	}

	update_test_model (callback) {
		var set = {
			'object.x': 'replaced!',
			'object.z': 3
		};
		this.data.test.apply_op_by_id(
			this.test_model.id,
			{ set: set },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_model.attributes.object, { x: 'replaced!', z: 3 });
				callback();
			}
		);
	}
}

module.exports = Apply_Set_Sub_Object_To_Database_Test;
