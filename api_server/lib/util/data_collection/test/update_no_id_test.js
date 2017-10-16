'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var Data_Collection_Test = require('./data_collection_test');
var Assert = require('assert');

class Update_No_Id_Test extends Data_Collection_Test {

	get description () {
		return 'should return an error when attempting to update a model with no ID';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_test_model
		], callback);
	}

	run (callback) {
		const update = {
			text: 'replaced!',
			number: 123
		};
		this.data.test.update(
			update,
			(error) => {
				const error_code = 'DTCL-1000';
				Assert(typeof error === 'object' && error.code && error.code === error_code, `error code ${error_code} expected`);
				callback();
			}
		);
	}
}

module.exports = Update_No_Id_Test;
