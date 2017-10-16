'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');

class Get_One_By_Query_Test extends Mongo_Test {

	get description () {
		return 'should get the correct document when getting one document by query';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_random_documents
		], callback);
	}

	run (callback) {
		this.test_document = this.documents[4];
		this.data.test.get_one_by_query(
			{
				text: this.test_document.text,
				flag: this.test_document.flag
			},
			(error, response) => {
				this.check_response(error, response, callback);
			}
		);
	}

	validate_response () {
		this.validate_document_response();
	}
}

module.exports = Get_One_By_Query_Test;
