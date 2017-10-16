'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Get_By_Id_Test = require('./get_by_id_test');

class Apply_Set_By_Id_Test extends Get_By_Id_Test {

	get description () {
		return 'should get the correctly updated document after applying a set operation to a document';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.update_document
		], callback);
	}

	update_document (callback) {
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.apply_op_by_id(
			this.test_document._id,
			{ set: update },
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_document, update);
				callback();
			}
		);
	}
}

module.exports = Apply_Set_By_Id_Test;
