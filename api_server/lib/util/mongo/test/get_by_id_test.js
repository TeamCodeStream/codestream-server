'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');

class Get_By_Id_Test extends Mongo_Test {

	get description () {
		return 'should get the correct document when getting a document by ID';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_and_control_document,
		], callback);
	}

	run (callback) {
		this.data.test.get_by_id(
			this.test_document._id,
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_document_response();
	}
}

module.exports = Get_By_Id_Test;
