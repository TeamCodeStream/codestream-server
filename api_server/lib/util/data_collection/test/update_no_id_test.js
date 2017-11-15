'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionTest = require('./data_collection_test');
var Assert = require('assert');

class UpdateNoIdTest extends DataCollectionTest {

	get description () {
		return 'should return an error when attempting to update a model with no ID';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createTestModel
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
				const errorCode = 'DTCL-1000';
				Assert(typeof error === 'object' && error.code && error.code === errorCode, `error code ${errorCode} expected`);
				callback();
			}
		);
	}
}

module.exports = UpdateNoIdTest;
