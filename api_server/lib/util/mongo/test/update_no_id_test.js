'use strict';

var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');
var Mongo_Test = require('./mongo_test');
var Assert = require('assert');

class Update_No_Id_Test extends Mongo_Test {

	get_description () {
		return 'should return an error when attempting to update a document with no ID';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_document
		], callback);
	}

	run (callback) {
		var update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				var error_code = 'MDTA-1001';
				Assert(typeof error === 'object' && error.code && error.code === error_code, `error code ${error_code} expected`);
				callback();
			}
		);
	}
}

module.exports = Update_No_Id_Test;
