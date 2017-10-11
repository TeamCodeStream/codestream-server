'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Get_By_Id_Test = require('./get_by_id_test');

class Apply_Push_By_Id_Test extends Get_By_Id_Test {

	get description () {
		return 'should get the correctly updated document after applying a push operation to a document';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.update_document
		], callback);
	}

	update_document (callback) {
		const update = {
			array: 7
		};
		this.data.test.apply_op_by_id(
			this.test_document._id,
			{ push: update },
			(error) => {
				if (error) { return callback(error); }
				this.test_document.array.push(7);
				callback();
			}
		);
	}
}

module.exports = Apply_Push_By_Id_Test;
