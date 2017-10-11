'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Get_By_Id_Test = require('./get_by_id_test');

class Apply_Pull_By_Id_Test extends Get_By_Id_Test {

	get description () {
		return 'should get the correctly updated document after applying a pull operation to a document';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.update_document
		], callback);
	}

	update_document (callback) {
		const update = {
			array: 4
		};
		this.data.test.apply_op_by_id(
			this.test_document._id,
			{ pull: update },
			(error) => {
				if (error) { return callback(error); }
				let index = this.test_document.array.indexOf(4);
				this.test_document.array.splice(index, 1);
				callback();
			}
		);
	}
}

module.exports = Apply_Pull_By_Id_Test;
