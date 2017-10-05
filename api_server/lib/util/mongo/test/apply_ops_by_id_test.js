'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Get_By_Id_Test = require('./get_by_id_test');

class Apply_Ops_By_Id_Test extends Get_By_Id_Test {

	get_description () {
		return 'should get the correctly updated document after applying several operations to a document';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.update_document
		], callback);
	}

	update_document (callback) {
		var ops = [
			{
				set: {
					text: 'replaced!',
					new_text: 'new text'
				},
				unset: {
					flag: true
				}
			},
			{
				push: {
					array: 9
				}
			},
			{
				push: {
					new_array: 1
				},
				pull: {
					array: 1
				},
			},
			{
				add: {
					new_array: 2
				},
				set: {
					new_text: 'new text replaced!'
				}
			}
		];
		this.data.test.apply_ops_by_id(
			this.test_document._id,
			ops,
			(error) => {
				if (error) { return callback(error); }
				Object.assign(this.test_document, {
					text: 'replaced!',
					new_text: 'new text replaced!',
					new_array: [1, 2]
				});
				delete this.test_document.flag;
				this.test_document.array.push(9);
				this.test_document.array.splice(0, 1);
				callback();
			}
		);
	}
}

module.exports = Apply_Ops_By_Id_Test;
