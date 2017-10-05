'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');

class Delete_By_Id_Test extends Mongo_Test {

	get_description () {
		return 'should not get a document after it has been deleted';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_and_control_document,
			this.delete_document
		], callback);
	}

	delete_document (callback) {
		this.data.test.delete_by_id(
			this.test_document._id,
			callback
		);
	}

	run (callback) {
		this.test_documents = [this.control_document];
		this.data.test.get_by_ids(
			[this.test_document._id, this.control_document._id],
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_array_response();
	}
}

module.exports = Delete_By_Id_Test;
