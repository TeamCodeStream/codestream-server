'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Get_By_Id_Test = require('./get_by_id_test');

class Apply_Set_Sub_Object_By_Id_Test extends Get_By_Id_Test {

	get_description () {
		return 'should get the correctly updated document after applying a set operation to a sub-object of a document';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.update_document
		], callback);
	}

	update_document (callback) {
		var update = {
			'object.x': 'replaced!',
			'object.z': 3
		};
		this.data.test.apply_op_by_id(
			this.test_document._id,
			{ set: update },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_document.object, { x: 'replaced!', z: 3 });
				callback();
			}
		);
	}
}

module.exports = Apply_Set_Sub_Object_By_Id_Test;
