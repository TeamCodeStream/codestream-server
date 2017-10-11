'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');

class Delete_By_Query_Test extends Mongo_Test {

	get description () {
		return 'should not get documents after they have been deleted by query';
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
		this.data.test.delete_by_query(
			{ flag: this.randomizer + 'no' },
			callback
		);
	}

	run (callback) {
		let ids = this.documents.map(document => { return document._id; });
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

module.exports = Delete_By_Query_Test;
