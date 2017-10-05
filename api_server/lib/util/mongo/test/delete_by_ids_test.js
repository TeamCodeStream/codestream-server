'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');

class Delete_By_Ids_Test extends Mongo_Test {

	get_description () {
		return 'should not get documents after they have been deleted by ID';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_documents,
			this.filter_test_documents,
			this.delete_documents
		], callback);
	}

	delete_documents (callback) {
		let to_delete = this.documents.filter(document => {
			return !this.want_n(document.number);
		});
		let ids = to_delete.map(document => { return document._id; });
		this.data.test.delete_by_ids(
			ids,
			callback
		);
	}

	run (callback) {
		var ids = this.documents.map(document => { return document._id; });
		this.data.test.get_by_ids(
			ids,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_array_response();
	}
}

module.exports = Delete_By_Ids_Test;
